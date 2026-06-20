"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ActivityQuizForm,
  type ActivityQuizFormHandle,
} from "./ActivityQuizForm";
import {
  QuizAIForm,
  type QuizAIFormValues,
} from "./ActivityCreationDialog/QuizAIForm";
import { AIQuizProgress } from "./ActivityCreationDialog/AIQuizProgress";
import { QuizAIReviewer } from "./ActivityCreationDialog/QuizAIReviewer";
import {
  useCreateLessonActivity,
  useUpdateLessonActivity,
  useDeleteLessonActivity,
  useCreateQuiz,
  useLessonActivitiesByLessonId,
  useQuizzesByLessonId,
} from "../api/course-management.hooks";
import { useGenerateQuizAIMutation } from "../api/ai-quiz.hooks";
import { useVideoById } from "@/features/video/api/video.hooks";

import type { QuizEditorState } from "../types";
import {
  canCreateInVideoQuiz,
  createAssignmentPayload,
  createQuizPayload,
} from "../utils/activity-creation.utils";
import { resolveActiveVideoSource } from "../utils/draft-video.utils";
import { ActivityDialogFooter } from "./ActivityCreationDialog/ActivityDialogFooter";
import { AssignmentForm } from "./ActivityCreationDialog/AssignmentForm";
import { InvalidVideoWarning } from "./ActivityCreationDialog/InvalidVideoWarning";
import { QuizModeSection } from "./ActivityCreationDialog/QuizModeSection";
import { createMediaUploadStream } from "@/features/_shared/realtime/media-upload-stream";
import { inferenceHttpClient } from "@/features/_shared/api-factories";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: number;
  lessonTitle: string;
  lessonVideoId?: number | null;
  draftVideoBlobUrl?: string | null;
  draftVideoDurationSeconds?: number;
  userId?: number;
}

export function ActivityCreationDialog({
  open,
  onOpenChange,
  lessonId,
  lessonTitle,
  lessonVideoId,
  draftVideoBlobUrl,
  draftVideoDurationSeconds = 0,
  userId,
}: Props) {
  const router = useRouter();
  const [activityTab, setActivityTab] = useState<"quiz" | "quiz-ai" | "assignment">("quiz");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [quizMode, setQuizMode] = useState<"in_video" | "outside_video">(
    "outside_video",
  );
  const [quizTimestamp, setQuizTimestamp] = useState("00:00:00.000");
  const quizFormRef = useRef<ActivityQuizFormHandle>(null);

  // AI Quiz Generation States
  const [view, setView] = useState<"create" | "generating" | "review">("create");
  const [stage, setStage] = useState("");
  const [generatedQuizId, setGeneratedQuizId] = useState<number | null>(null);
  const [generatedActivityId, setGeneratedActivityId] = useState<number | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const { data: lessonActivities } = useLessonActivitiesByLessonId(lessonId);
  const { data: lessonVideo } = useVideoById(lessonVideoId ?? null);
  const { data: inVideoQuizzes } = useQuizzesByLessonId(
    lessonId,
    "in_video",
    open
  );

  const createLessonActivityMutation = useCreateLessonActivity();
  const updateLessonActivityMutation = useUpdateLessonActivity();
  const deleteLessonActivityMutation = useDeleteLessonActivity();
  const createQuizMutation = useCreateQuiz();
  const generateQuizAIMutation = useGenerateQuizAIMutation();
  const sseRef = useRef<any>(null);

  const { url: activeVideoUrl, durationSeconds: activeVideoDurationSeconds, hasVideoSource } =
    resolveActiveVideoSource({
      serverUrl: lessonVideo?.url,
      serverDuration: lessonVideo?.duration,
      draftBlobUrl: draftVideoBlobUrl,
      draftDurationSeconds: draftVideoDurationSeconds,
      hasVideoId: Boolean(lessonVideoId),
    });

  const canUseInVideoQuiz = canCreateInVideoQuiz(
    hasVideoSource,
    activeVideoDurationSeconds > 0 ? 1 : 0,
  );

  const handleOpenChange = async (val: boolean) => {
    if (!val) {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }

      // Clean up the draft activity if the user cancels AI generation or review
      if ((view === "generating" || view === "review") && generatedActivityId) {
        try {
          await deleteLessonActivityMutation.mutateAsync(generatedActivityId);
        } catch (err) {
          console.warn("Failed to delete draft activity on dialog close:", err);
        }
      }

      setView("create");
      setStage("");
      setGeneratedQuizId(null);
      setGeneratedActivityId(null);
      setActiveJobId(null);
    }
    onOpenChange(val);
  };

  const handleCreateAssignment = async () => {
    const nextOrderIndex = (lessonActivities?.length ?? 0) + 1;
    const payload = createAssignmentPayload(
      lessonId,
      assignmentTitle,
      lessonTitle,
      nextOrderIndex,
      userId,
    );
    await createLessonActivityMutation.mutateAsync(payload);

    toast.success("Đã tạo bài tập");
    handleOpenChange(false);
    router.refresh();
  };

  const handleCreateQuizFromPopup = async (state: QuizEditorState) => {
    if (quizMode === "in_video" && !canUseInVideoQuiz) {
      toast.error("Bài học chưa có video hợp lệ để tạo quiz trong video");
      return;
    }

    const nextOrderIndex = (lessonActivities?.length ?? 0) + 1;
    const createdActivity = await createLessonActivityMutation.mutateAsync({
      lessonId,
      activityType: "quiz",
      title: state.title.trim() || `Quiz: ${lessonTitle}`,
      description: state.description.trim() || "Activity quiz",
      orderIndex: nextOrderIndex,
      status: "draft",
      createdBy: userId,
    });

    const payload = createQuizPayload(
      state,
      createdActivity.id,
      quizMode,
      quizTimestamp,
    );

    await createQuizMutation.mutateAsync(payload);
    toast.success("Đã tạo quiz từ popup");
    handleOpenChange(false);
    router.refresh();
  };

  const handleCreateQuizAI = async (values: QuizAIFormValues) => {
    if (!lessonVideoId) {
      toast.error("Bài học cần có video để sinh câu hỏi bằng AI.");
      return;
    }

    try {
      const nextOrderIndex = (lessonActivities?.length ?? 0) + 1;
      const createdActivity = await createLessonActivityMutation.mutateAsync({
        lessonId,
        activityType: "quiz",
        title: values.name.trim() || `Quiz AI: ${lessonTitle}`,
        description: "AI_REVIEW_PENDING", // Hold from appearing on player timeline until approved
        orderIndex: nextOrderIndex,
        status: "draft",
        createdBy: userId,
      });

      setGeneratedActivityId(createdActivity.id);

      const jobResp = await generateQuizAIMutation.mutateAsync({
        videoId: lessonVideoId,
        lessonActivityId: createdActivity.id,
        name: values.name,
        difficulty: values.difficulty,
        numQuestions: values.numQuestions,
        language: values.language,
        shuffleQuestion: values.shuffleQuestion,
        shuffleOption: values.shuffleOption,
        passingScore: values.passingScore,
        timeLimitMinutes: values.timeLimitMinutes,
        isInVideo: values.isInVideo,
        startTime: values.startTime,
        endTime: values.endTime,
      });

      const jobId = jobResp.jobId;
      setActiveJobId(jobId);
      setStage("Đang gửi yêu cầu sinh câu hỏi...");
      setView("generating");

      if (sseRef.current) {
        sseRef.current.close();
      }

      sseRef.current = createMediaUploadStream({
        onProgress: (payload) => {
          if (payload.jobId === jobId) {
            setStage(payload.stage || "Đang phân tích video...");
          }
        },
        onError: (payload) => {
          if (payload.jobId === jobId) {
            toast.error(`Sinh quiz thất bại: ${payload.error?.message || "Lỗi từ worker"}`);
            setView("create");
            setStage("");
            setActiveJobId(null);

          }
        },
        onQuizGenerated: (payload) => {
          if (payload.jobId === jobId) {
            if (payload.status === "completed") {
              toast.success("Đã sinh câu hỏi thành công!");
              setGeneratedQuizId(payload.quizId);
              setView("review");
            } else {
              toast.error("AI worker báo lỗi khi sinh câu hỏi.");
              setView("create");
            }
            setStage("");
            setActiveJobId(null);
            if (sseRef.current) {
              sseRef.current.close();
              sseRef.current = null;
            }

          }
        },
      }, { userId });


    } catch (err: any) {
      toast.error(err?.message || "Đã xảy ra lỗi khi tạo yêu cầu sinh quiz.");
    }
  };

  const handleCancelGeneration = async () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }

    if (generatedActivityId) {
      try {
        await deleteLessonActivityMutation.mutateAsync(generatedActivityId);
      } catch (err) {
        console.warn("Failed to delete draft activity on cancel generation:", err);
      }
    }

    setView("create");
    setStage("");
    setGeneratedActivityId(null);
    setActiveJobId(null);
    toast.info("Đã hủy và loại bỏ hoạt động Quiz AI đang sinh.");
  };

  const handleCompleteReview = async () => {
    if (generatedActivityId) {
      try {
        await updateLessonActivityMutation.mutateAsync({
          id: generatedActivityId,
          data: {
            description: "AI Quiz generated from lesson video", // Finalize description to show markers
          },
        });
      } catch (err) {
        console.error("Failed to finalize activity description:", err);
      }
    }
    toast.success("Đã lưu và hoàn tất Quiz AI!");
    handleOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={cn(
        "h-[90vh] w-[96vw] overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl transition-all duration-300",
        view === "review" ? "sm:max-w-5xl" : "!max-w-2xl"
      )}>
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="sticky top-0 z-10 border-b border-border/70 bg-linear-to-r from-background to-muted/20 px-4 py-4 text-left sm:px-6">
            <DialogTitle className="text-xl font-bold">
              {view === "review" ? "Duyệt bộ câu hỏi AI" : "Tạo hoạt động mới"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/80 mt-1">
              {view === "review" 
                ? "Kiểm tra và tinh chỉnh các câu hỏi được sinh bằng trí tuệ nhân tạo trước khi áp dụng." 
                : "Thiết lập bộ câu hỏi kiểm tra tích hợp trong timeline video hoặc sau bài học."}
            </DialogDescription>
          </DialogHeader>

          <div className={cn(
            "min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto overflow-x-hidden",
            view === "review" && "overflow-hidden flex flex-col"
          )}>
            {view === "generating" ? (
              <AIQuizProgress stage={stage} onCancel={handleCancelGeneration} />
            ) : view === "review" ? (
              <QuizAIReviewer 
                quizId={generatedQuizId!} 
                lessonVideoUrl={activeVideoUrl} 
                onComplete={handleCompleteReview} 
              />
            ) : (
              <Tabs
                value={activityTab}
                onValueChange={(value) =>
                  setActivityTab(value as "quiz" | "quiz-ai" | "assignment")
                }
                className="w-full"
              >
                <TabsList className="grid h-11 w-full grid-cols-3 rounded-xl border border-border/60 bg-muted/40 p-1">
                  <TabsTrigger value="quiz" className="rounded-lg">
                    Quiz thủ công
                  </TabsTrigger>
                  <TabsTrigger value="quiz-ai" className="rounded-lg">
                    Quiz AI ✨
                  </TabsTrigger>
                  <TabsTrigger value="assignment" className="rounded-lg">
                    Bài tập
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="quiz" className="space-y-4 pt-4">
                  <QuizModeSection
                    quizMode={quizMode}
                    onQuizModeChange={setQuizMode}
                    quizTimestamp={quizTimestamp}
                    onTimestampChange={setQuizTimestamp}
                    canUseInVideoQuiz={canUseInVideoQuiz}
                    lessonVideoUrl={activeVideoUrl}
                    lessonVideoDuration={activeVideoDurationSeconds}
                  />

                  <InvalidVideoWarning
                    show={!canUseInVideoQuiz && quizMode === "in_video"}
                  />

                  <div className="pt-2">
                    <ActivityQuizForm
                      ref={quizFormRef}
                      initialInVideo={quizMode === "in_video"}
                      defaultTimestamp={quizTimestamp}
                      onSubmit={handleCreateQuizFromPopup}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="quiz-ai" className="space-y-4 pt-4">
                  <QuizAIForm
                    lessonTitle={lessonTitle}
                    hasVideo={hasVideoSource}
                    isPending={generateQuizAIMutation.isPending}
                    onSubmit={handleCreateQuizAI}
                    onCancel={() => handleOpenChange(false)}
                    existingQuizzes={inVideoQuizzes}
                    videoDurationSeconds={activeVideoDurationSeconds}
                    videoUrl={activeVideoUrl}
                  />
                </TabsContent>

                <TabsContent value="assignment" className="space-y-4 pt-4">
                  <AssignmentForm
                    assignmentTitle={assignmentTitle}
                    onTitleChange={setAssignmentTitle}
                    lessonTitle={lessonTitle}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>

          {view === "create" && (
            <ActivityDialogFooter
              activityTab={activityTab}
              onCancel={() => handleOpenChange(false)}
              onCreateAssignment={() => void handleCreateAssignment()}
              onCreateQuiz={() => void quizFormRef.current?.submit()}
              isAssignmentPending={createLessonActivityMutation.isPending}
              isQuizPending={createQuizMutation.isPending}
              isQuizAIPending={generateQuizAIMutation.isPending}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

