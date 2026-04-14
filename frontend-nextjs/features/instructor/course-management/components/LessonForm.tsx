import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useVideoById,
  useVideosByUser,
} from "@/features/video/api/video.hooks";
import { useLessonActivitiesByLessonId } from "../api/course-management.hooks";
import type {
  InstructorCourse,
  InstructorLesson,
  LessonFormValues,
} from "../types";
import {
  buildInitialLessonValues,
  isLessonEditMode,
} from "../utils/lesson-form.utils";
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

  const initialValues = useMemo<LessonFormValues>(
    () => buildInitialLessonValues(courseId, lesson),
    [courseId, lesson],
  );

  const { register, control, handleSubmit, reset, setValue } =
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
    <div className="space-y-4 p-4 w-full">
      {/* Lesson Form Section */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="border-border/60 bg-linear-to-br from-background via-background to-muted/20 shadow-sm">
          <CardContent className="space-y-4 p-4">
            <div>
              <div className="space-y-1 mb-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Lesson workspace
                </p>
                <h2 className="text-lg font-semibold">
                  Thiết kế nội dung bài học
                </h2>
                <p className="text-xs text-muted-foreground">
                  Tiêu đề, mô tả và thời lượng bài học.
                </p>
              </div>

              <LessonMetadataForm
                isEdit={isEdit}
                titleRegister={register("title", { required: true })}
                descriptionRegister={register("description", {
                  required: true,
                })}
                durationRegister={register("duration", {
                  setValueAs: (value: string) => Number(value || 0),
                })}
                onSubmit={handleSubmit(onSubmit)}
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
          activities={activities}
          isLoading={activitiesLoading}
        />
      )}

      {/* Video Preview - Edit Page Only */}
      {isEdit && (
        <VideoPreview
          videoUrl={selectedVideo?.url}
          videoLoading={videoLoading}
        />
      )}
    </div>
  );
}
