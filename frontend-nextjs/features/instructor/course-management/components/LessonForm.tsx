import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { NotebookText, Clapperboard, X } from "lucide-react";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { lessonFormSchema } from "../schemas";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useVideoById,
  useVideosByUser,
} from "@/features/video/api/video.hooks";
import {
  useLessonActivitiesByLessonId,
  useQuizzesByLessonId,
  useCreateLessonActivity,
  useCreateQuiz,
} from "../api/course-management.hooks";
import type {
  InstructorCourse,
  InstructorLesson,
  LessonFormValues,
  QuizEditorState,
} from "../types";
import {
  buildInitialLessonValues,
  isLessonEditMode,
} from "../utils/lesson-form.utils";
import { buildQuizTimelineMarkers } from "../utils/quiz-timeline.utils";
import {
  canCreateInVideoQuiz,
  generateTimestampOptions,
  createQuizPayload,
} from "../utils/activity-creation.utils";
import { resolveActiveVideoSource } from "../utils/draft-video.utils";
import type { LessonFormVideoContext } from "../utils/draft-video.utils";
import { cn } from "@/lib/utils";
import { ActivitiesDisplay } from "./LessonForm/ActivitiesDisplay";
import { LessonMetadataForm } from "./LessonForm/LessonMetadataForm";
import { VideoSelectionSection } from "./LessonForm/VideoSelectionSection";
import { OutsideQuizEditorDialog } from "./LessonForm/OutsideQuizEditorDialog";
import { QuizModeSection } from "./ActivityCreationDialog/QuizModeSection";
import {
  ActivityQuizForm,
  type ActivityQuizFormHandle,
} from "./ActivityQuizForm";

interface Props {
  lesson?: InstructorLesson | null;
  courseId: number;
  course?: InstructorCourse | null;
  onSave?: (payload: LessonFormValues) => Promise<number | void>;
  onSaved?: () => void;
  onVideoContextChange?: (context: LessonFormVideoContext) => void;
}

export function LessonForm({ lesson, courseId, onSave, onSaved, onVideoContextChange }: Props) {
  const { user } = useAuth();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setPortalTarget(document.getElementById("lesson-form-actions-portal"));
  }, []);

  const isEdit = isLessonEditMode(lesson);
  const lessonId = lesson?.id ?? null;
  const [editingOutsideQuizActivityId, setEditingOutsideQuizActivityId] =
    useState<number | null>(null);
  const [showQuizEditorModal, setShowQuizEditorModal] = useState(false);
  const [pendingQuizStates, setPendingQuizStates] = useState<QuizEditorState[]>(
    [],
  );
  const [draftVideoBlobUrl, setDraftVideoBlobUrl] = useState<string | null>(
    null,
  );
  const [draftVideoDurationSeconds, setDraftVideoDurationSeconds] =
    useState<number>(0);
  const [quizMode, setQuizMode] = useState<"in_video" | "outside_video">(
    "in_video",
  );
  const [quizTimestamp, setQuizTimestamp] = useState("00:00:00.000");
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const { data: activities, isLoading: activitiesLoading } =
    useLessonActivitiesByLessonId(lessonId, Boolean(lessonId));

  const { data: inVideoQuizzes, isLoading: quizzesLoading } =
    useQuizzesByLessonId(lessonId, "in_video", undefined, Boolean(lessonId));

  const { data: outVideoQuizzes, isLoading: outVideoQuizzesLoading } =
    useQuizzesByLessonId(lessonId, "after_video", undefined, Boolean(lessonId));

  const initialValues = useMemo<LessonFormValues>(
    () => buildInitialLessonValues(courseId, lesson),
    [courseId, lesson],
  );

  const createLessonActivityMutation = useCreateLessonActivity();
  const createQuizMutation = useCreateQuiz();
  const quizFormRef = useRef<ActivityQuizFormHandle>(null);

  const { register, control, handleSubmit, reset, setValue, formState } =
    useForm<LessonFormValues>({
      resolver: zodResolver(lessonFormSchema),
      defaultValues: initialValues,
    });

  const selectedVideoId = useWatch({ control, name: "videoId" }) ?? null;

  const {
    data: userVideos,
    isLoading: videosLoading,
    refetch: refetchUserVideos,
  } = useVideosByUser("long", Boolean(user?.id && !selectedVideoId));

  const { data: selectedVideo, isLoading: videoLoading } = useVideoById(
    selectedVideoId,
    Boolean(selectedVideoId),
  );

  const selectedVideoDurationSeconds = Number(selectedVideo?.duration ?? 0);
  const {
    url: activeVideoUrl,
    durationSeconds: activeVideoDurationSeconds,
    hasVideoSource,
  } = resolveActiveVideoSource({
    serverUrl: selectedVideo?.url,
    serverDuration: selectedVideo?.duration,
    draftBlobUrl: draftVideoBlobUrl,
    draftDurationSeconds: draftVideoDurationSeconds,
    hasVideoId: Boolean(selectedVideoId),
  });

  const isVideoProcessing = Boolean(
    selectedVideo?.thumbnail === "processing" ||
      (!activeVideoUrl && !videoLoading && !draftVideoBlobUrl && selectedVideoId)
  );

  const timestampOptions = useMemo(
    () => generateTimestampOptions(activeVideoDurationSeconds),
    [activeVideoDurationSeconds],
  );

  const canUseInVideoQuiz = canCreateInVideoQuiz(
    hasVideoSource,
    timestampOptions.length,
  );

  const handleDraftVideoChange = useCallback(
    ({
      blobUrl,
      durationSeconds,
    }: {
      blobUrl: string | null;
      durationSeconds: number | null;
      fileName: string | null;
    }) => {
      setDraftVideoBlobUrl(blobUrl);
      setDraftVideoDurationSeconds(durationSeconds ?? 0);
    },
    [],
  );

  useEffect(() => {
    onVideoContextChange?.({
      selectedVideoId,
      draftVideoBlobUrl,
      draftVideoDurationSeconds,
    });
  }, [
    draftVideoBlobUrl,
    draftVideoDurationSeconds,
    onVideoContextChange,
    selectedVideoId,
  ]);

  useEffect(() => {
    if (!canUseInVideoQuiz && quizMode === "in_video") {
      setQuizMode("outside_video");
    }
  }, [canUseInVideoQuiz, quizMode]);

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    if (isEdit) {
      return;
    }

    const durationSeconds =
      Number(selectedVideo?.duration ?? 0) > 0
        ? Number(selectedVideo?.duration ?? 0)
        : draftVideoDurationSeconds;
    if (durationSeconds <= 0) {
      return;
    }

    setValue("duration", durationSeconds, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [draftVideoDurationSeconds, isEdit, selectedVideo?.duration, setValue]);

  const parseTimestampToSeconds = (ts: string): number => {
    const parts = ts.split(":");
    if (parts.length !== 3) return 0;
    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);
    const seconds = Number(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  };

  useEffect(() => {
    if (activeVideoDurationSeconds <= 0 || pendingQuizStates.length === 0) {
      return;
    }

    let hasAdjusted = false;
    const adjusted = pendingQuizStates.map((quiz) => {
      if (!quiz.isInVideo) return quiz;

      const updatedQuestions = quiz.questions.map((q) => {
        if (!q.videoTimestamp) return q;

        const sec = parseTimestampToSeconds(q.videoTimestamp);
        if (sec > activeVideoDurationSeconds) {
          hasAdjusted = true;
          const totalSec = Math.floor(activeVideoDurationSeconds);
          const h = Math.floor(totalSec / 3600);
          const m = Math.floor((totalSec % 3600) / 60);
          const s = totalSec % 60;
          return {
            ...q,
            videoTimestamp: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.000`,
          };
        }
        return q;
      });

      return { ...quiz, questions: updatedQuestions };
    });

    if (hasAdjusted) {
      setPendingQuizStates(adjusted);
      toast.warning(
        "Một số mốc thời gian Quiz trong video vượt quá thời lượng video mới và đã được tự động đưa về cuối video mới."
      );
    }
  }, [activeVideoDurationSeconds, pendingQuizStates]);

  const hasInvalidSavedQuizzes = useMemo(() => {
    if (!activeVideoDurationSeconds || !inVideoQuizzes) return false;
    return inVideoQuizzes.some((quiz) =>
      quiz.questions?.some((q) => {
        if (!q.videoTimestamp) return false;
        return parseTimestampToSeconds(q.videoTimestamp) > activeVideoDurationSeconds;
      })
    );
  }, [inVideoQuizzes, activeVideoDurationSeconds]);

  const timelineMarkers = useMemo(
    () => buildQuizTimelineMarkers(inVideoQuizzes, activities),
    [inVideoQuizzes, activities],
  );

  const displayActivities = useMemo(() => {
    const outsideVideoActivityIds = new Set(
      (outVideoQuizzes ?? []).map((quiz) => quiz.lessonActivityId),
    );

    return (activities ?? []).filter((activity) => {
      if (activity.activityType !== "quiz") {
        return true;
      }

      return outsideVideoActivityIds.has(activity.id);
    });
  }, [activities, outVideoQuizzes]);

  const savePendingQuizzes = async (
    targetLessonId: number,
    quizzes: QuizEditorState[],
  ) => {
    if (quizzes.length === 0) {
      return;
    }

    let nextOrderIndex = (activities?.length ?? 0) + 1;

    for (const pendingQuiz of quizzes) {
      const createdActivity = await createLessonActivityMutation.mutateAsync({
        lessonId: targetLessonId,
        activityType: "quiz",
        title: pendingQuiz.title.trim() || "Quiz: Bài học",
        description: pendingQuiz.description.trim() || "Activity quiz",
        orderIndex: nextOrderIndex,
        status: "public",
        createdBy: user?.id,
      });
      nextOrderIndex += 1;

      await createQuizMutation.mutateAsync({
        ...pendingQuiz,
        lessonActivityId: createdActivity.id,
      });
    }

    setPendingQuizStates([]);
    toast.success(`Đã lưu ${quizzes.length} quiz`);
  };

  const handleSaveLocalQuiz = async (state: QuizEditorState) => {
    if (lessonId) {
      // Save directly if lesson already created
      const nextOrderIndex = (activities?.length ?? 0) + 1;
      const createdActivity = await createLessonActivityMutation.mutateAsync({
        lessonId,
        activityType: "quiz",
        title: state.title.trim() || "Quiz: Bài học",
        description: state.description.trim() || "Activity quiz",
        orderIndex: nextOrderIndex,
        status: "public",
        createdBy: user?.id,
      });

      const quizPayload = createQuizPayload(
        state,
        createdActivity.id,
        quizMode,
        quizTimestamp,
      );

      await createQuizMutation.mutateAsync(quizPayload);

      toast.success("Đã tạo quiz");
      setShowQuizEditorModal(false);
      setQuizMode("in_video");
      setQuizTimestamp("00:00:00.000");
    } else {
      const quizPayload = createQuizPayload(
        state,
        null as any,
        quizMode,
        quizTimestamp,
      );
      setPendingQuizStates((current) => [...current, quizPayload]);
      setShowQuizEditorModal(false);
      setQuizMode("in_video");
      setQuizTimestamp("00:00:00.000");
      toast.info("Quiz sẽ được lưu khi bạn tạo bài học");
    }
  };

  const onSubmit = async (values: LessonFormValues) => {
    try {
      const savedLessonId = await onSave?.({
        courseId: values.courseId,
        title: values.title.trim(),
        description: values.description.trim(),
        contentType: "video",
        duration: Number(values.duration || activeVideoDurationSeconds || 0),
        content: {
          ...values.content,
          url:
            selectedVideo?.url ??
            activeVideoUrl ??
            (values.content as { url?: string }).url ??
            undefined,
        },
        videoId: values.videoId,
      });

      if (typeof savedLessonId === "number" && pendingQuizStates.length > 0) {
        await savePendingQuizzes(savedLessonId, pendingQuizStates);
      }

      onSaved?.();
      toast.success(isEdit ? "Đã cập nhật bài học" : "Đã tạo bài học mới");
    } catch {
      toast.error("Không thể lưu bài học");
    }
  };

  return (
    <div className="w-full space-y-6">
      {portalTarget && createPortal(
        <>
          {!isEdit && (
            <Button
              type="button"
              variant="outline"
              className="h-10 text-xs font-semibold rounded-xl border-primary text-primary hover:bg-primary/5 hover:text-primary gap-1.5 shadow-sm transition-all"
              onClick={() => setShowQuizEditorModal(true)}
            >
              <NotebookText className="h-4 w-4 text-primary" />
              Tạo hoạt động
            </Button>
          )}
          <Button
            type="submit"
            form="lesson-form"
            className="min-w-[120px] h-10 text-xs font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
            disabled={formState.isSubmitting || isUploadingVideo}
          >
            {isUploadingVideo ? "Đang tải video..." : (isEdit ? "Lưu bài học" : "Tạo bài học")}
          </Button>
        </>,
        portalTarget
      )}

      {/* Lesson Form Section */}
      <form id="lesson-form" onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
        {hasInvalidSavedQuizzes && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive flex flex-col gap-1.5 shadow-sm">
            <p className="font-semibold">⚠️ Cảnh báo mốc thời gian Quiz</p>
            <p>Video mới ngắn hơn thời lượng video cũ, khiến một số Quiz đã lưu có mốc thời gian vượt quá video. Vui lòng kiểm tra lại danh sách Quiz đã lưu bên dưới.</p>
          </div>
        )}

        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <NotebookText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-base font-semibold">Thông tin bài học</p>
                <p className="text-xs text-muted-foreground">
                  Đặt tên bài học và viết mô tả tóm tắt nội dung.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <LessonMetadataForm
                titleRegister={register("title")}
                descriptionRegister={register("description")}
                errors={formState.errors}
              />

              <input
                type="hidden"
                {...register("duration", {
                  setValueAs: (value: string) => Number(value || 0),
                })}
              />
            </div>
          </CardContent>
        </Card>

        <Controller
          name="videoId"
          control={control}
          render={({ field }) => (
            <Card
              ref={field.ref}
              tabIndex={-1}
              className={cn(
                "border-border/60 shadow-sm transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-destructive/30",
                formState.errors.videoId && "border-destructive bg-destructive/[0.01]"
              )}
            >
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Clapperboard className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">
                      Video bài học <span className="text-destructive">*</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tải lên hoặc chọn video gắn cho bài học này.
                    </p>
                  </div>
                </div>

                {formState.errors.videoId && (
                  <p className="text-sm font-medium text-destructive mt-1">{formState.errors.videoId.message}</p>
                )}

                <div className="pt-2">
                  {!isEdit && (
                    <VideoSelectionSection
                      isEdit={false}
                      courseId={courseId}
                      videosLoading={videosLoading}
                      userVideos={userVideos}
                      selectedVideoId={field.value ?? null}
                      onRefreshVideos={async () => {
                        await refetchUserVideos();
                      }}
                      onVideoSelect={(videoId) =>
                        field.onChange(videoId)
                      }
                      onDraftVideoChange={handleDraftVideoChange}
                      onPendingCreateQuiz={() => setShowQuizEditorModal(true)}
                      onUploadStateChange={setIsUploadingVideo}
                      timelineMarkers={timelineMarkers}
                      isProcessing={isVideoProcessing}
                    />
                  )}

                  {isEdit && (
                    <VideoSelectionSection
                      isEdit={true}
                      courseId={courseId}
                      videosLoading={videosLoading}
                      userVideos={userVideos}
                      selectedVideoId={field.value ?? null}
                      onRefreshVideos={async () => {
                        await refetchUserVideos();
                      }}
                      onVideoSelect={(videoId) =>
                        field.onChange(videoId)
                      }
                      onDraftVideoChange={handleDraftVideoChange}
                      lessonId={lessonId}
                      onOpenCreateQuizModal={() => setShowQuizEditorModal(true)}
                      onUploadStateChange={setIsUploadingVideo}
                      timelineMarkers={timelineMarkers}
                      isProcessing={isVideoProcessing}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        />
      </form>

      {!isEdit && pendingQuizStates.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {pendingQuizStates.length} quiz đang chờ — sẽ lưu khi bạn tạo bài học.
        </p>
      ) : null}

      {/* Activities Section */}
      {lessonId && (
        <ActivitiesDisplay
          activities={displayActivities}
          isLoading={
            activitiesLoading || quizzesLoading || outVideoQuizzesLoading
          }
          timelineCount={timelineMarkers.length}
          onEditQuiz={(activityId) => {
            setEditingOutsideQuizActivityId(activityId);
          }}
        />
      )}

      {lessonId ? (
        <OutsideQuizEditorDialog
          open={editingOutsideQuizActivityId !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingOutsideQuizActivityId(null);
            }
          }}
          lessonTitle={lesson?.title ?? "Bài học"}
          lessonActivityId={editingOutsideQuizActivityId}
        />
      ) : null}

      {/* Local Quiz Editor Modal */}
      <Dialog open={showQuizEditorModal} onOpenChange={setShowQuizEditorModal}>
        <DialogContent 
          showCloseButton={false}
          className="h-[92vh] w-[92vw] sm:max-w-2xl overflow-hidden rounded-2xl border border-border/70 p-0 shadow-2xl flex flex-col transition-all duration-300"
        >
          <div className="flex h-full min-h-0 flex-col">
            <DialogHeader className="sticky top-0 z-10 border-b border-border/70 bg-linear-to-r from-background to-muted/20 px-5 py-4 pr-12 text-left relative">
              <DialogTitle className="text-xl font-bold">Tạo hoạt động mới</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground/80 mt-1">
                Thiết lập bộ câu hỏi kiểm tra tích hợp trong timeline video hoặc sau bài học.
              </DialogDescription>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowQuizEditorModal(false);
                  setQuizMode("in_video");
                  setQuizTimestamp("00:00:00.000");
                }}
                className="absolute right-4 top-4 h-8 w-8 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground z-20"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 space-y-6">
              <QuizModeSection
                quizMode={quizMode}
                onQuizModeChange={setQuizMode}
                quizTimestamp={quizTimestamp}
                onTimestampChange={setQuizTimestamp}
                canUseInVideoQuiz={canUseInVideoQuiz}
                lessonVideoUrl={activeVideoUrl}
                lessonVideoDuration={activeVideoDurationSeconds}
              />

              {!canUseInVideoQuiz && hasVideoSource ? (
                <div className="rounded-xl border border-dashed border-amber-300 bg-amber-500/[0.03] p-3 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Video đang tải thông tin. Quiz ngoài video có thể tạo ngay; quiz trong video sẽ khả dụng khi video tải xong thời lượng.</span>
                </div>
              ) : null}

              {/* Quiz Form */}
              <ActivityQuizForm
                ref={quizFormRef}
                initialInVideo={quizMode === "in_video"}
                defaultTimestamp={quizTimestamp}
                onSubmit={handleSaveLocalQuiz}
              />
            </div>

            <DialogFooter className="sticky bottom-0 border-t border-border/70 bg-background px-5 py-4 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowQuizEditorModal(false);
                  setQuizMode("in_video");
                  setQuizTimestamp("00:00:00.000");
                }}
                className="h-9 text-xs font-semibold px-4"
              >
                Hủy
              </Button>
              <Button
                onClick={() => void quizFormRef.current?.submit()}
                disabled={
                  createLessonActivityMutation.isPending ||
                  createQuizMutation.isPending
                }
                className="h-9 text-xs font-semibold px-4"
              >
                {createLessonActivityMutation.isPending ||
                createQuizMutation.isPending
                  ? "Đang lưu..."
                  : "Tạo quiz"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
