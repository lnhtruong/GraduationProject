"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
  useCreateQuiz,
  useLessonActivitiesByLessonId,
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
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const sseRef = useRef<any>(null);

  const { data: lessonActivities } = useLessonActivitiesByLessonId(lessonId);
  const { data: lessonVideo } = useVideoById(lessonVideoId ?? null);

  const createLessonActivityMutation = useCreateLessonActivity();
  const createQuizMutation = useCreateQuiz();
  const generateQuizAIMutation = useGenerateQuizAIMutation();

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

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }
      setView("create");
      setStage("");
      setGeneratedQuizId(null);
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
        description: `AI Quiz generated from lesson video`,
        orderIndex: nextOrderIndex,
        status: "draft",
        createdBy: userId,
      });

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
        startTime: values.startTime ? Number(values.startTime) : undefined,
        endTime: values.endTime ? Number(values.endTime) : undefined,
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

  const handleCancelGeneration = () => {
    if (sseRef.current) {
      sseRef.current.close();
      sseRef.current = null;
    }
    setView("create");
    setStage("");
    setActiveJobId(null);
    toast.info("Đã hủy kết nối theo dõi tiến trình.");
  };

  const handleCompleteReview = () => {
    toast.success("Đã lưu và hoàn tất Quiz AI!");
    handleOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="h-[90vh] w-[96vw] max-w-none overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl sm:w-[94vw] lg:w-7xl">
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

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-5">
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
                    hasVideo={Boolean(lessonVideoId)}
                    isPending={generateQuizAIMutation.isPending}
                    onSubmit={handleCreateQuizAI}
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

          {view === "create" ? (
            activityTab === "quiz-ai" ? (
              <div className="flex items-center justify-end gap-3 border-t border-border/70 bg-muted/10 px-4 py-3 sm:px-6">
                <Button variant="ghost" onClick={() => handleOpenChange(false)} className="h-10 rounded-lg">
                  Hủy
                </Button>
              </div>
            ) : (
              <ActivityDialogFooter
                activityTab={activityTab}
                onCancel={() => handleOpenChange(false)}
                onCreateAssignment={() => void handleCreateAssignment()}
                onCreateQuiz={() => void quizFormRef.current?.submit()}
                isAssignmentPending={createLessonActivityMutation.isPending}
                isQuizPending={createQuizMutation.isPending}
              />
            )
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

