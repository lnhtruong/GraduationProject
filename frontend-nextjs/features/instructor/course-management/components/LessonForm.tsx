import { useEffect, useMemo, useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ActivitiesDisplay } from "./LessonForm/ActivitiesDisplay";
import { LessonMetadataForm } from "./LessonForm/LessonMetadataForm";
import { VideoPreview } from "./LessonForm/VideoPreview";
import { VideoSelectionSection } from "./LessonForm/VideoSelectionSection";
import { OutsideQuizEditorDialog } from "./LessonForm/OutsideQuizEditorDialog";
import {
  ActivityQuizForm,
  type ActivityQuizFormHandle,
} from "./ActivityQuizForm";

interface Props {
  lesson?: InstructorLesson | null;
  courseId: number;
  course?: InstructorCourse | null;
  onSave?: (payload: LessonFormValues) => Promise<void> | void;
}

export function LessonForm({ lesson, courseId, onSave }: Props) {
  const { user } = useAuth();
  const isEdit = isLessonEditMode(lesson);
  const lessonId = lesson?.id ?? null;
  const [editingOutsideQuizActivityId, setEditingOutsideQuizActivityId] =
    useState<number | null>(null);
  const [showQuizEditorModal, setShowQuizEditorModal] = useState(false);
  const [pendingQuizState, setPendingQuizState] =
    useState<QuizEditorState | null>(null);
  const [draftVideoBlobUrl, setDraftVideoBlobUrl] = useState<string | null>(
    null,
  );
  const [draftVideoDurationSeconds, setDraftVideoDurationSeconds] =
    useState<number>(0);
  const [quizMode, setQuizMode] = useState<"in_video" | "outside_video">(
    "outside_video",
  );
  const [quizTimestamp, setQuizTimestamp] = useState("00:00:00.000");

  const {
    data: userVideos,
    isLoading: videosLoading,
    refetch: refetchUserVideos,
  } = useVideosByUser("long", Boolean(user?.id) && !isEdit);

  const { data: activities, isLoading: activitiesLoading } =
    useLessonActivitiesByLessonId(lessonId, Boolean(lessonId));

  const { data: inVideoQuizzes, isLoading: quizzesLoading } =
    useQuizzesByLessonId(lessonId, "in_video", Boolean(lessonId));

  const { data: outVideoQuizzes, isLoading: outVideoQuizzesLoading } =
    useQuizzesByLessonId(lessonId, "after_video", Boolean(lessonId));

  const initialValues = useMemo<LessonFormValues>(
    () => buildInitialLessonValues(courseId, lesson),
    [courseId, lesson],
  );

  const createLessonActivityMutation = useCreateLessonActivity();
  const createQuizMutation = useCreateQuiz();
  const quizFormRef = useRef<ActivityQuizFormHandle>(null);

  const { register, control, handleSubmit, reset, setValue, formState } =
    useForm<LessonFormValues>({
      defaultValues: initialValues,
    });

  const selectedVideoId = useWatch({ control, name: "videoId" }) ?? null;

  const { data: selectedVideo, isLoading: videoLoading } = useVideoById(
    selectedVideoId,
    Boolean(selectedVideoId),
  );

  const selectedVideoDurationSeconds = Number(selectedVideo?.duration ?? 0);
  const activeVideoDurationSeconds =
    selectedVideoDurationSeconds > 0
      ? selectedVideoDurationSeconds
      : draftVideoDurationSeconds;

  const timestampOptions = useMemo(
    () => generateTimestampOptions(activeVideoDurationSeconds),
    [activeVideoDurationSeconds],
  );

  const canUseInVideoQuiz = canCreateInVideoQuiz(
    Boolean(selectedVideoId || draftVideoBlobUrl),
    timestampOptions.length,
  );

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

    const durationSeconds = Number(selectedVideo?.duration ?? 0);
    if (durationSeconds <= 0) {
      return;
    }

    setValue("duration", durationSeconds, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [isEdit, selectedVideo?.duration, setValue]);

  useEffect(() => {
    if (!pendingQuizState || !lessonId) {
      return;
    }
    // Auto save pending quiz after lesson is created
    (async () => {
      try {
        const nextOrderIndex = (activities?.length ?? 0) + 1;
        const createdActivity = await createLessonActivityMutation.mutateAsync({
          lessonId,
          activityType: "quiz",
          title: pendingQuizState.title.trim() || "Quiz: Bài học",
          description: pendingQuizState.description.trim() || "Activity quiz",
          orderIndex: nextOrderIndex,
          status: "draft",
          createdBy: user?.id,
        });

        await createQuizMutation.mutateAsync({
          ...pendingQuizState,
          lessonActivityId: createdActivity.id,
        });

        toast.success("Đã tạo quiz");
      } catch (error) {
        toast.error("Không thể lưu quiz");
      }
      setPendingQuizState(null);
    })();
  }, [lessonId, pendingQuizState]);

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
        status: "draft",
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
      setQuizMode("outside_video");
      setQuizTimestamp("00:00:00.000");
    } else {
      // Pending quiz - will save after lesson is created
      const quizPayload = createQuizPayload(
        state,
        null as any,
        quizMode,
        quizTimestamp,
      );
      setPendingQuizState(quizPayload);
      setShowQuizEditorModal(false);
      setQuizMode("outside_video");
      setQuizTimestamp("00:00:00.000");
      toast.info("Sẽ lưu quiz sau khi tạo bài học");
    }
  };

  const onSubmit = async (values: LessonFormValues) => {
    await onSave?.({
      courseId: values.courseId,
      title: values.title.trim(),
      description: values.description.trim(),
      contentType: "video",
      duration: Number(values.duration || 0),
      content: {
        ...values.content,
        url:
          selectedVideo?.url ??
          (values.content as { url?: string }).url ??
          undefined,
      },
      videoId: values.videoId,
    });

    toast.success(isEdit ? "Đã cập nhật bài học" : "Đã tạo bài học mới");
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-3 sm:p-4 lg:p-6">
      {/* Lesson Form Section */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="overflow-hidden border-border/70 bg-linear-to-br from-background via-background to-muted/20 shadow-sm">
          <CardContent className="space-y-6 p-4 sm:p-6">
            <div>
              <div className="mb-5 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-xs">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Lesson workspace
                    </p>
                    <h2 className="text-xl font-semibold tracking-tight">
                      Thiết kế nội dung bài học
                    </h2>
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Tạo nội dung rõ ràng, sau đó chọn hoặc upload video để gắn
                      cho bài học.
                    </p>
                  </div>

                  <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:pt-1">
                    <Button
                      type="submit"
                      className="h-10 w-full rounded-full px-5 whitespace-nowrap sm:w-auto"
                      disabled={formState.isSubmitting}
                    >
                      {isEdit ? "Lưu bài học" : "Tạo bài học"}
                    </Button>
                  </div>
                </div>
              </div>

              <LessonMetadataForm
                titleRegister={register("title", { required: true })}
                descriptionRegister={register("description", {
                  required: true,
                })}
              />

              <input
                type="hidden"
                {...register("duration", {
                  setValueAs: (value: string) => Number(value || 0),
                })}
              />
            </div>

            {!isEdit && (
              <VideoSelectionSection
                videosLoading={videosLoading}
                userVideos={userVideos}
                selectedVideoId={selectedVideoId}
                canUseInVideoQuiz={canUseInVideoQuiz}
                onRefreshVideos={async () => {
                  await refetchUserVideos();
                }}
                onVideoSelect={(videoId) =>
                  setValue("videoId", videoId, { shouldDirty: true })
                }
                onDraftVideoChange={({ blobUrl, durationSeconds }) => {
                  setDraftVideoBlobUrl(blobUrl);
                  setDraftVideoDurationSeconds(durationSeconds ?? 0);
                }}
                onPendingCreateQuiz={() => setShowQuizEditorModal(true)}
              />
            )}

            {isEdit && (
              <VideoSelectionSection
                videosLoading={videosLoading}
                userVideos={userVideos}
                selectedVideoId={selectedVideoId}
                canUseInVideoQuiz={canUseInVideoQuiz}
                onRefreshVideos={async () => {
                  await refetchUserVideos();
                }}
                onVideoSelect={(videoId) =>
                  setValue("videoId", videoId, { shouldDirty: true })
                }
                onDraftVideoChange={({ blobUrl, durationSeconds }) => {
                  setDraftVideoBlobUrl(blobUrl);
                  setDraftVideoDurationSeconds(durationSeconds ?? 0);
                }}
                lessonId={lessonId}
                onOpenCreateQuizModal={() => {
                  setEditingOutsideQuizActivityId(null);
                }}
              />
            )}
          </CardContent>
        </Card>
      </form>

      {/* Video Preview - Edit Page Only */}
      {isEdit && (
        <VideoPreview
          courseId={courseId}
          lessonId={lessonId ?? 0}
          videoUrl={selectedVideo?.url}
          videoDurationSeconds={Number(selectedVideo?.duration ?? 0)}
          videoLoading={videoLoading}
          timelineMarkers={timelineMarkers}
        />
      )}

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
        <DialogContent className="max-h-[92vh] w-[96vw] max-w-5xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-border/60 px-5 py-4">
            <DialogTitle>Tạo hoạt động mới</DialogTitle>
            <DialogDescription>
              Tạo quiz dây để ngay trong popup hoặc tạo activity bài tập. Quiz
              ngoài video có thể tạo ngay khi bài học chưa có
              &quot;videoId&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 p-4 sm:p-5">
            {/* Quiz Mode Section */}
            <div className="rounded-lg border border-border/60 bg-background/80 p-4">
              <h3 className="mb-4 font-semibold text-sm">Vị trí quiz</h3>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="quizMode"
                      value="outside_video"
                      checked={quizMode === "outside_video"}
                      onChange={(e) =>
                        setQuizMode(
                          e.target.value as "outside_video" | "in_video",
                        )
                      }
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="text-sm font-medium">Ngoài video</p>
                      <p className="text-xs text-muted-foreground">
                        Chọn &quot;Ngoài video&quot; nếu bạn muốn tạo quiz ngay.
                        Chọn &quot;Trong video&quot; chỉ khi video đã có thời
                        lượng để lấy mốc.
                      </p>
                    </div>
                  </label>
                </div>

                {canUseInVideoQuiz && (
                  <div>
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="quizMode"
                        value="in_video"
                        checked={quizMode === "in_video"}
                        onChange={(e) =>
                          setQuizMode(
                            e.target.value as "outside_video" | "in_video",
                          )
                        }
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="text-sm font-medium">Trong video</p>
                        <p className="text-xs text-muted-foreground">
                          Chọn mốc quiz trong timeline video
                        </p>
                      </div>
                    </label>

                    {quizMode === "in_video" && (
                      <div className="mt-3 ml-7 space-y-2">
                        <label className="text-xs font-medium">
                          Chọn mốc quiz trên timeline video
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            Mốc chọn:
                          </span>
                          <select
                            value={quizTimestamp}
                            onChange={(e) => setQuizTimestamp(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-border/60 text-sm"
                          >
                            {timestampOptions.map((timestamp) => (
                              <option key={timestamp} value={timestamp}>
                                {timestamp}
                              </option>
                            ))}
                          </select>
                          {activeVideoDurationSeconds > 0 && (
                            <span className="text-xs text-muted-foreground">
                              / {Math.floor(activeVideoDurationSeconds / 60)}:
                              {String(
                                Math.floor(activeVideoDurationSeconds % 60),
                              ).padStart(2, "0")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!canUseInVideoQuiz && (selectedVideoId || draftVideoBlobUrl) && (
                <p className="mt-3 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  Chỉ quiz trong video mới cần video đã có thời lượng. Quiz
                  ngoài video có thể tạo ngay khi bài học chưa có
                  &quot;videoId&quot;.
                </p>
              )}
            </div>

            {/* Quiz Form */}
            <ActivityQuizForm
              ref={quizFormRef}
              initialInVideo={quizMode === "in_video"}
              defaultTimestamp={quizTimestamp}
              onSubmit={handleSaveLocalQuiz}
            />
          </div>

          <DialogFooter className="border-t border-border/60 px-5 py-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowQuizEditorModal(false);
                setQuizMode("outside_video");
                setQuizTimestamp("00:00:00.000");
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={() => void quizFormRef.current?.submit()}
              disabled={
                createLessonActivityMutation.isPending ||
                createQuizMutation.isPending
              }
            >
              {createLessonActivityMutation.isPending ||
              createQuizMutation.isPending
                ? "Đang lưu..."
                : "Tạo quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
