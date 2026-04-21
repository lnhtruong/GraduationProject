import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useVideoById,
  useVideosByUser,
} from "@/features/video/api/video.hooks";
import {
  useLessonActivitiesByLessonId,
  useQuizzesByLessonId,
} from "../api/course-management.hooks";
import type {
  InstructorCourse,
  InstructorLesson,
  LessonFormValues,
} from "../types";
import {
  buildInitialLessonValues,
  isLessonEditMode,
} from "../utils/lesson-form.utils";
import { buildQuizTimelineMarkers } from "../utils/quiz-timeline.utils";
import { ActivitiesDisplay } from "./LessonForm/ActivitiesDisplay";
import { LessonMetadataForm } from "./LessonForm/LessonMetadataForm";
import { VideoPreview } from "./LessonForm/VideoPreview";
import { VideoSelectionSection } from "./LessonForm/VideoSelectionSection";

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

  const { data: userVideos, isLoading: videosLoading } = useVideosByUser(
    "highlight",
    Boolean(user?.id) && !isEdit,
  );

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

  const { register, control, handleSubmit, reset, setValue, formState } =
    useForm<LessonFormValues>({
      defaultValues: initialValues,
    });

  const selectedVideoId = useWatch({ control, name: "videoId" }) ?? null;

  const { data: selectedVideo, isLoading: videoLoading } = useVideoById(
    selectedVideoId,
    Boolean(selectedVideoId),
  );

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    if (isEdit) {
      return;
    }

    const seconds = Number(selectedVideo?.duration ?? 0);
    if (seconds <= 0) {
      return;
    }

    const durationMinutes = Math.max(1, Math.ceil(seconds / 60));
    setValue("duration", durationMinutes, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [isEdit, selectedVideo?.duration, setValue]);

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
    <div className="w-full space-y-4 p-3 sm:p-4 lg:p-6">
      {/* Lesson Form Section */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="border-border/60 bg-linear-to-br from-background via-background to-muted/20 shadow-sm">
          <CardContent className="space-y-4 p-3 sm:p-4">
            <div>
              <div className="space-y-1 mb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                      Lesson workspace
                    </p>
                    <h2 className="text-lg font-semibold">
                      Thiết kế nội dung bài học
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Tiêu đề và mô tả bài học.
                    </p>
                  </div>

                  <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:pt-1">
                    <Button
                      type="submit"
                      className="h-9 w-full px-4 whitespace-nowrap sm:w-auto"
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
                onVideoSelect={(videoId) =>
                  setValue("videoId", videoId, { shouldDirty: true })
                }
              />
            )}
          </CardContent>
        </Card>
      </form>

      {/* Activities Section */}
      {lessonId && (
        <ActivitiesDisplay
          courseId={courseId}
          lessonId={lessonId}
          activities={displayActivities}
          isLoading={
            activitiesLoading || quizzesLoading || outVideoQuizzesLoading
          }
          timelineCount={timelineMarkers.length}
        />
      )}

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
    </div>
  );
}
