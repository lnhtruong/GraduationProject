"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  invalidateLessonQuizCache,
  useCreateLessonActivity,
  useUpdateLessonActivity,
  useDeleteLessonActivity,
  useCreateQuiz,
  useLessonActivitiesByLessonId,
  useQuizzesByLessonId,
} from "../api/course-management.hooks";
import { useGenerateQuizAIMutation } from "../api/ai-quiz.hooks";
import { aiQuizApi, type AiQuizJobStatus } from "../api/ai-quiz.api";
import { quizApi } from "../api/course-management.api";
import { useVideoById } from "@/features/video/api/video.hooks";
import { useQuota, formatResetAt } from "@/features/_shared/quota";

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
  clearPersistedInferenceJob,
  INFERENCE_JOB_POLL_INTERVAL_MS,
  INFERENCE_JOB_SSE_RECONNECT_MS,
  INFERENCE_JOB_STORAGE_TTL_MS,
  type InferenceJobWatcher,
  type PersistedInferenceJob,
  readPersistedInferenceJob,
  watchInferenceJob,
  writePersistedInferenceJob,
} from "@/features/_shared/realtime/inference-job-watcher";
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

const AI_QUIZ_POLL_INTERVAL_MS = INFERENCE_JOB_POLL_INTERVAL_MS;
const AI_QUIZ_RECONNECT_MS = INFERENCE_JOB_SSE_RECONNECT_MS;
const AI_QUIZ_ACTIVE_STATUSES = ["processing", "completed"];

type AiQuizSession = PersistedInferenceJob & {
  lessonId: number;
  lessonActivityId: number;
  videoId: number;
  quizName?: string;
  quizId?: number;
  status: "processing" | "completed";
};

function getErrorMessage(error: unknown, fallback: string) {
  return getUserFacingErrorMessage(error, fallback);
}

function getAiQuizSessionKey(lessonId: number) {
  return `studyloop:ai-quiz:${lessonId}`;
}

function getAiQuizSessionStorage(lessonId: number, userId?: number | null) {
  return {
    key: getAiQuizSessionKey(lessonId),
    storage: "session" as const,
    ttlMs: INFERENCE_JOB_STORAGE_TTL_MS,
    userId,
    contextId: lessonId,
    activeStatuses: AI_QUIZ_ACTIVE_STATUSES,
  };
}

function readAiQuizSession(
  lessonId: number,
  userId?: number | null,
): AiQuizSession | null {
  const parsed = readPersistedInferenceJob<AiQuizSession>(
    getAiQuizSessionStorage(lessonId, userId),
  );
  if (
    !parsed ||
    parsed.lessonId !== lessonId ||
    !parsed.lessonActivityId ||
    !parsed.videoId
  ) {
    return null;
  }

  return {
    ...parsed,
    lessonId,
    status: parsed.status === "completed" ? "completed" : "processing",
  };
}

function writeAiQuizSession(session: AiQuizSession, userId?: number | null) {
  writePersistedInferenceJob(
    getAiQuizSessionStorage(session.lessonId, userId),
    {
      ...session,
      lessonId: session.lessonId,
    },
  );
}

function clearAiQuizSession(lessonId: number) {
  clearPersistedInferenceJob({
    key: getAiQuizSessionKey(lessonId),
    storage: "session",
  });
}

function isCompletedStatus(status?: string) {
  return ["completed", "complete", "success", "succeeded"].includes(
    status?.trim().toLowerCase() ?? "",
  );
}

function isFailedStatus(status?: string) {
  return ["failed", "error", "cancelled", "canceled"].includes(
    status?.trim().toLowerCase() ?? "",
  );
}

function getAiQuizStatusError(status: AiQuizJobStatus) {
  if (typeof status.error === "string") return status.error;
  if (typeof status.result?.error === "string") return status.result.error;
  return undefined;
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
  const [activityTab, setActivityTab] = useState<
    "quiz" | "quiz-ai" | "assignment"
  >("quiz");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [quizMode, setQuizMode] = useState<"in_video" | "outside_video">(
    "outside_video",
  );
  const [quizTimestamp, setQuizTimestamp] = useState("00:00:00.000");
  const quizFormRef = useRef<ActivityQuizFormHandle>(null);

  // AI Quiz Generation States
  const [view, setView] = useState<"create" | "generating" | "review">(
    "create",
  );
  const [stage, setStage] = useState("");
  const [generatedQuizId, setGeneratedQuizId] = useState<number | null>(null);
  const [generatedActivityId, setGeneratedActivityId] = useState<number | null>(
    null,
  );
  const finalizedActivityIdsRef = useRef<Set<number>>(new Set());
  const isFinalizingReviewRef = useRef(false);
  const { data: lessonActivities } = useLessonActivitiesByLessonId(lessonId);
  const { data: lessonVideo } = useVideoById(lessonVideoId ?? null);
  const { data: inVideoQuizzes } = useQuizzesByLessonId(
    lessonId,
    "in_video",
    undefined,
    open,
  );

  const createLessonActivityMutation = useCreateLessonActivity();
  const updateLessonActivityMutation = useUpdateLessonActivity();
  const deleteLessonActivityMutation = useDeleteLessonActivity();
  const createQuizMutation = useCreateQuiz();
  const generateQuizAIMutation = useGenerateQuizAIMutation();
  const aiQuizWatcherRef = useRef<InferenceJobWatcher | null>(null);
  const aiQuizSessionRef = useRef<AiQuizSession | null>(null);

  const {
    url: activeVideoUrl,
    durationSeconds: activeVideoDurationSeconds,
    hasVideoSource,
  } = resolveActiveVideoSource({
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
  // Giá quiz tính theo đoạn video chọn trong QuizAIForm, nên nó báo ngược lên.
  const { data: quota } = useQuota();
  const [isQuotaBlocked, setIsQuotaBlocked] = useState(false);

  const isAiQuizBlocked = Boolean(
    isVideoPreparing || !lessonVideoId || !hasAiQuizSource || isQuotaBlocked,
  );
  // Chưa gọi được quota thì không bịa ra mốc reset — cửa sổ 24h neo theo lần
  // dùng đầu của từng người nên không có giờ mặc định nào đúng.
  const quotaResetAt = formatResetAt(quota?.resetAt ?? null);
  const aiQuizBlockedReason = isVideoPreparing
    ? "Video đang được upload hoặc xử lý trên Bunny. Vui lòng chờ hệ thống nhận URL video trước khi tạo quiz."
    : !lessonVideoId
      ? "Bài học cần có video trước khi tạo quiz."
      : !hasAiQuizSource
        ? "Video chưa có URL hoặc phụ đề để tạo câu hỏi. Vui lòng chờ Bunny xử lý xong."
        : isQuotaBlocked
          ? `Bạn không còn đủ credit AI.${quotaResetAt ? ` Hạn mức reset lúc ${quotaResetAt}.` : ""}`
          : "";

  const canUseInVideoQuiz = canCreateInVideoQuiz(
    hasVideoSource,
    activeVideoDurationSeconds > 0 ? 1 : 0,
  );

  const clearAiQuizWatcher = useCallback(() => {
    aiQuizWatcherRef.current?.close();
    aiQuizWatcherRef.current = null;
  }, []);

  const findGeneratedQuizForActivity = useCallback(
    async (lessonActivityId: number) => {
      const [inVideo, afterVideo] = await Promise.all([
        quizApi.listByLesson(lessonId, "in_video"),
        quizApi.listByLesson(lessonId, "after_video"),
      ]);
      return (
        [...inVideo, ...afterVideo].find(
          (quiz) => quiz.lessonActivityId === lessonActivityId,
        ) ?? null
      );
    },
    [lessonId],
  );

  const showGeneratedQuizReview = useCallback(
    async (session: AiQuizSession, quizId?: number) => {
      let resolvedQuizId = quizId ?? session.quizId;

      if (!resolvedQuizId) {
        setStage("Đã tạo xong, đang lưu câu hỏi...");
        const quiz = await findGeneratedQuizForActivity(
          session.lessonActivityId,
        );
        resolvedQuizId = quiz?.id;
      }

      if (!resolvedQuizId) return false;

      const completedSession: AiQuizSession = {
        ...session,
        quizId: resolvedQuizId,
        status: "completed",
      };
      aiQuizSessionRef.current = completedSession;
      writeAiQuizSession(completedSession, userId);
      finalizedActivityIdsRef.current.delete(session.lessonActivityId);
      setGeneratedActivityId(session.lessonActivityId);
      setGeneratedQuizId(resolvedQuizId);
      setStage("");
      setView("review");
      clearAiQuizWatcher();
      await Promise.all([invalidateLessonQuizCache(queryClient, lessonId)]);
      return true;
    },
    [
      clearAiQuizWatcher,
      findGeneratedQuizForActivity,
      lessonId,
      queryClient,
      userId,
    ],
  );

  const startAiQuizWatcher = useCallback(
    (session: AiQuizSession, options: { restored?: boolean } = {}) => {
      clearAiQuizWatcher();
      aiQuizSessionRef.current = session;
      writeAiQuizSession(session, userId);
      setGeneratedActivityId(session.lessonActivityId);
      setActivityTab("quiz-ai");
      setView(session.status === "completed" ? "review" : "generating");
      setStage(
        session.status === "completed"
          ? ""
          : options.restored
            ? "Đang nối lại tiến trình tạo quiz..."
            : "Đang gửi yêu cầu tạo câu hỏi...",
      );

      let finished = false;
      const finishWithReview = async (quizId?: number) => {
        if (finished) return;
        const opened = await showGeneratedQuizReview(session, quizId);
        if (!opened) return;
        finished = true;
        if (!options.restored) toast.success("Đã tạo câu hỏi.");
      };

      const failJob = (message?: string) => {
        if (finished) return;
        finished = true;
        clearAiQuizWatcher();
        clearAiQuizSession(session.lessonId);
        aiQuizSessionRef.current = null;
        setView("create");
        setStage("");
        toast.error(message || "Không thể tạo quiz. Vui lòng thử lại.");
      };

      if (session.status === "completed") {
        void finishWithReview(session.quizId);
        return;
      }

      if (!userId) {
        failJob(
          "Không thể theo dõi tiến trình tạo quiz. Vui lòng đăng nhập lại.",
        );
        return;
      }

      aiQuizWatcherRef.current = watchInferenceJob<AiQuizJobStatus>({
        userId,
        pollIntervalMs: AI_QUIZ_POLL_INTERVAL_MS,
        reconnectMs: AI_QUIZ_RECONNECT_MS,
        pollStatus: () => aiQuizApi.getJobStatus(session.jobId),
        onPollStatus: async (status) => {
          if (finished) return;
          const statusJobId = status.jobId ?? status.job_id;
          if (statusJobId && statusJobId !== session.jobId) return;

          if (typeof status.stage === "string" && status.stage.trim()) {
            setStage(status.stage.trim());
          }

          const error = getAiQuizStatusError(status);
          if (isFailedStatus(status.status) || error) {
            failJob(error);
            return;
          }

          if (isCompletedStatus(status.status)) {
            await finishWithReview();
          }
        },
        onProgress: (payload) => {
          if (payload.jobId !== session.jobId) return;
          setStage(payload.stage || "Đang phân tích video...");
        },
        onError: (payload) => {
          if (payload.jobId !== session.jobId) return;
          failJob(
            getErrorMessage(
              payload.error,
              "Không thể tạo quiz. Vui lòng thử lại.",
            ),
          );
        },
        onQuizGenerated: (payload) => {
          if (payload.jobId !== session.jobId) return;
          if (payload.status === "completed") {
            void finishWithReview(payload.quizId);
          } else {
            failJob("Không thể tạo câu hỏi từ video.");
          }
        },
      });
    },
    [clearAiQuizWatcher, showGeneratedQuizReview, userId],
  );

  useEffect(() => {
    if (!open || view !== "create") return;
    const session = readAiQuizSession(lessonId, userId);
    if (!session) return;
    const restoreTimer = window.setTimeout(() => {
      startAiQuizWatcher(session, { restored: true });
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, [lessonId, open, startAiQuizWatcher, userId, view]);

  useEffect(() => () => clearAiQuizWatcher(), [clearAiQuizWatcher]);

  const handleOpenChange = async (val: boolean) => {
    if (!val) {
      clearAiQuizWatcher();

      // Clean up the draft activity if the user cancels AI generation or review
      if (
        view === "review" &&
        generatedActivityId &&
        !isFinalizingReviewRef.current &&
        !finalizedActivityIdsRef.current.has(generatedActivityId)
      ) {
        try {
          await deleteLessonActivityMutation.mutateAsync(generatedActivityId);
        } catch (err) {
          console.warn("Failed to delete draft activity on dialog close:", err);
        }
      }

      if (view !== "generating") {
        clearAiQuizSession(lessonId);
        aiQuizSessionRef.current = null;
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
    await invalidateLessonQuizCache(queryClient, lessonId);
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

      startAiQuizWatcher({
        jobId: jobResp.jobId,
        lessonId,
        lessonActivityId: createdActivity.id,
        videoId: readyVideoId,
        quizName: jobResp.quizName,
        status: "processing",
        userId,
        contextId: lessonId,
      });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Không thể bắt đầu tạo quiz."));
    }
  };

  const handleCancelGeneration = async () => {
    isFinalizingReviewRef.current = false;
    clearAiQuizWatcher();
    clearAiQuizSession(lessonId);
    aiQuizSessionRef.current = null;

    if (generatedActivityId) {
      try {
        await deleteLessonActivityMutation.mutateAsync(generatedActivityId);
      } catch (err) {
        console.warn(
          "Failed to delete draft activity on cancel generation:",
          err,
        );
      }
    }

    setView("create");
    setStage("");
    setGeneratedActivityId(null);
    setGeneratedQuizId(null);
    toast.info("Đã hủy bản nháp quiz đang tạo.");
  };

  const handleCompleteReview = async () => {
    isFinalizingReviewRef.current = true;
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
        isFinalizingReviewRef.current = false;
        toast.error("Không thể lưu quiz. Vui lòng thử lại.");
        return;
      }
      finalizedActivityIdsRef.current.add(activityId);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["instructor-lesson-activity", "lessonId", lessonId],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "lesson-quizzes",
            "by-lesson",
            lessonId,
            "in_video",
            "all",
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "lesson-quizzes",
            "by-lesson",
            lessonId,
            "after_video",
            "all",
          ],
        }),
      ]);
    }
    setGeneratedActivityId(null);
    clearAiQuizSession(lessonId);
    aiQuizSessionRef.current = null;
    toast.success("Đã lưu quiz.");
    await handleOpenChange(false);
    isFinalizingReviewRef.current = false;
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "h-[90vh] w-[96vw] overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl transition-all duration-300",
          view === "review" ? "sm:max-w-5xl" : "!max-w-2xl",
        )}
      >
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

          <div
            className={cn(
              "min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto overflow-x-hidden",
              view === "review" && "overflow-hidden flex flex-col",
            )}
          >
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
                    hasVideo={
                      hasVideoSource && hasAiQuizSource && !isVideoPreparing
                    }
                    disabled={isAiQuizBlocked}
                    disabledReason={aiQuizBlockedReason}
                    onSubmit={handleCreateQuizAI}
                    existingQuizzes={inVideoQuizzes}
                    videoDurationSeconds={activeVideoDurationSeconds}
                    onQuotaBlockedChange={setIsQuotaBlocked}
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
