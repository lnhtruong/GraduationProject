"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X } from "lucide-react";

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
import {
  createMediaUploadStream,
  type UploadStreamSubscription,
} from "@/features/_shared/realtime/media-upload-stream";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId: number;
  lessonTitle: string;
  lessonVideoId?: number | null;
  draftVideoBlobUrl?: string | null;
  draftVideoDurationSeconds?: number;
  isVideoPreparing?: boolean;
  userId?: number;
}

function getErrorMessage(error: unknown, fallback: string) {
  return getUserFacingErrorMessage(error, fallback);
}

export function ActivityCreationDialog({
  open,
  onOpenChange,
  lessonId,
  lessonTitle,
  lessonVideoId,
  draftVideoBlobUrl,
  draftVideoDurationSeconds = 0,
  isVideoPreparing = false,
  userId,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
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
  const finalizedActivityIdsRef = useRef<Set<number>>(new Set());
  const { data: lessonActivities } = useLessonActivitiesByLessonId(lessonId);
  const { data: lessonVideo } = useVideoById(lessonVideoId ?? null);
  const { data: inVideoQuizzes } = useQuizzesByLessonId(
    lessonId,
    "in_video",
    undefined,
    open
  );

  const createLessonActivityMutation = useCreateLessonActivity();
  const updateLessonActivityMutation = useUpdateLessonActivity();
  const deleteLessonActivityMutation = useDeleteLessonActivity();
  const createQuizMutation = useCreateQuiz();
  const generateQuizAIMutation = useGenerateQuizAIMutation();
  const sseRef = useRef<UploadStreamSubscription | null>(null);

  const { url: activeVideoUrl, durationSeconds: activeVideoDurationSeconds, hasVideoSource } =
    resolveActiveVideoSource({
      serverUrl: lessonVideo?.url,
      serverDuration: lessonVideo?.duration,
      draftBlobUrl: draftVideoBlobUrl,
      draftDurationSeconds: draftVideoDurationSeconds,
      hasVideoId: Boolean(lessonVideoId),
    });

  const hasAiQuizSource = Boolean(
    lessonVideo?.srt_raw_url?.trim() ||
      lessonVideo?.srtRawUrl?.trim() ||
      lessonVideo?.url?.trim(),
  );
  const isAiQuizBlocked = Boolean(
    isVideoPreparing || !lessonVideoId || !hasAiQuizSource,
  );
  const aiQuizBlockedReason = isVideoPreparing
    ? "Video đang được upload hoặc xử lý trên Bunny. Vui lòng chờ hệ thống nhận URL video trước khi tạo quiz."
    : !lessonVideoId
      ? "Bài học cần có video trước khi tạo quiz."
      : !hasAiQuizSource
        ? "Video chưa có URL hoặc phụ đề để tạo câu hỏi. Vui lòng chờ Bunny xử lý xong."
        : "";

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
      if (
        (view === "generating" || view === "review") &&
        generatedActivityId &&
        !finalizedActivityIdsRef.current.has(generatedActivityId)
      ) {
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
      status: "public",
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
    if (isAiQuizBlocked) {
      toast.error(aiQuizBlockedReason || "Video chưa sẵn sàng để tạo quiz.");
      return;
    }
    const readyVideoId = Number(lessonVideoId);

    try {
      const nextOrderIndex = (lessonActivities?.length ?? 0) + 1;
      const createdActivity = await createLessonActivityMutation.mutateAsync({
        lessonId,
        activityType: "quiz",
        title: values.name.trim() || `Quiz từ video: ${lessonTitle}`,
        description: "AI_REVIEW_PENDING", // Hold from appearing on player timeline until approved
        orderIndex: nextOrderIndex,
        status: "draft",
        createdBy: userId,
      });

      finalizedActivityIdsRef.current.delete(createdActivity.id);
      setGeneratedActivityId(createdActivity.id);

      const jobResp = await generateQuizAIMutation.mutateAsync({
        videoId: readyVideoId,
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
      setStage("Đang gửi yêu cầu tạo câu hỏi...");
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
            const message = getErrorMessage(
              payload.error,
              "Không thể tạo quiz. Vui lòng thử lại.",
            );
            toast.error(message);
            setView("create");
            setStage("");

          }
        },
        onQuizGenerated: (payload) => {
          if (payload.jobId === jobId) {
            if (payload.status === "completed") {
              toast.success("Đã tạo câu hỏi.");
              setGeneratedQuizId(payload.quizId);
              setView("review");
            } else {
              toast.error("Không thể tạo câu hỏi từ video.");
              setView("create");
            }
            setStage("");
            if (sseRef.current) {
              sseRef.current.close();
              sseRef.current = null;
            }

          }
        },
      }, { userId });


    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Không thể bắt đầu tạo quiz."));
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
    toast.info("Đã hủy bản nháp quiz đang tạo.");
  };

  const handleCompleteReview = async () => {
    const activityId = generatedActivityId;
    if (activityId) {
      try {
        await updateLessonActivityMutation.mutateAsync({
          id: activityId,
          data: {
            description: "AI Quiz generated from lesson video", // Finalize description to show markers
            status: "public",
          },
        });
      } catch (err) {
        console.error("Failed to finalize activity description:", err);
        toast.error("Không thể lưu quiz. Vui lòng thử lại.");
        return;
      }
      finalizedActivityIdsRef.current.add(activityId);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["instructor-lesson-activity", "lessonId", lessonId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["lesson-quizzes", "by-lesson", lessonId, "in_video", "all"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["lesson-quizzes", "by-lesson", lessonId, "after_video", "all"],
        }),
      ]);
    }
    setGeneratedActivityId(null);
    toast.success("Đã lưu quiz.");
    handleOpenChange(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className={cn(
        "h-[90vh] w-[96vw] overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl transition-all duration-300",
        view === "review" ? "sm:max-w-5xl" : "!max-w-2xl"
      )}>
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="sticky top-0 z-20 border-b border-border/70 bg-linear-to-r from-background to-muted/20 px-4 py-4 pr-14 text-left sm:px-6 sm:pr-16">
            <DialogTitle className="text-xl font-bold">
              {view === "review" ? "Duyệt câu hỏi" : "Tạo hoạt động mới"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground/80 mt-1">
              {view === "review" 
                ? "Kiểm tra và chỉnh lại câu hỏi trước khi áp dụng vào bài học." 
                : "Thiết lập bộ câu hỏi kiểm tra tích hợp trong timeline video hoặc sau bài học."}
            </DialogDescription>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void handleOpenChange(false)}
              className="absolute right-3 top-3 z-30 h-9 w-9 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground sm:right-5"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </Button>
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
                    Quiz từ video
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
                    hasVideo={hasVideoSource && hasAiQuizSource && !isVideoPreparing}
                    disabled={isAiQuizBlocked}
                    disabledReason={aiQuizBlockedReason}
                    onSubmit={handleCreateQuizAI}
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
              isQuizAIDisabled={isAiQuizBlocked}
              quizAIDisabledReason={aiQuizBlockedReason}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

