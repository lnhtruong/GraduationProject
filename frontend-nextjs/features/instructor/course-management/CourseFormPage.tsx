"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ManagementPageShell } from "./components/ManagementPageShell";
import { CourseForm } from "./components/CourseForm";
import {
  useCreateCourse,
  useInstructorCourseById,
  usePublishCourse,
  useSubmitCourseForReview,
  useUpdateCourse,
} from "./api/course-management.hooks";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface Props {
  courseId?: number;
}

function getWorkflowErrorMessage(error: unknown, fallback: string) {
  const responseMessage = (error as {
    response?: { data?: { message?: unknown } };
  }).response?.data?.message;

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

export default function CourseFormPage({ courseId }: Props) {
  const router = useRouter();
  const isEdit = courseId !== undefined;
  const { user } = useAuth();
  const { data: course, isLoading } = useInstructorCourseById(
    isEdit ? courseId : null,
  );
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();
  const submitForReviewMutation = useSubmitCourseForReview();
  const publishCourseMutation = usePublishCourse();

  const handleCourseStatusAction = async () => {
    if (!course) {
      return;
    }

    try {
      if (course.status === "draft") {
        await submitForReviewMutation.mutateAsync(course.id);
        toast.success("Đã gửi khóa học chờ duyệt");
        router.refresh();
        return;
      }

      if (course.status === "approved") {
        await publishCourseMutation.mutateAsync(course.id);
        toast.success("Đã publish khóa học");
        router.refresh();
      }
    } catch (error) {
      toast.error(getWorkflowErrorMessage(error, "Cập nhật trạng thái thất bại"));
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground sm:p-5">
        Đang tải khóa học...
      </div>
    );
  }

  if (isEdit && !course) {
    return (
      <ManagementPageShell
        title="Không tìm thấy khóa học"
        description="Khóa học cần chỉnh sửa không tồn tại trên hệ thống."
        breadcrumbs={[
          { label: "Quản lý khóa học", href: "/instructor/courses" },
          { label: "Chỉnh sửa khóa học" },
        ]}
        leadingAction={
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      >
        <div className="p-4 text-sm text-muted-foreground sm:p-5">
          Vui lòng chọn một khóa học hợp lệ.
        </div>
      </ManagementPageShell>
    );
  }

  return (
    <ManagementPageShell
      title={isEdit ? "Chỉnh sửa khóa học" : "Tạo khóa học mới"}
      noCard
      description={
        isEdit
          ? "Cập nhật thông tin khóa học, danh mục, giá bán và mô tả."
          : "Tạo khóa học mới cho giảng viên, sau đó thêm bài học và quiz bên trong."
      }
      breadcrumbs={[
        { label: "Quản lý khóa học", href: "/instructor/courses" },
        { label: isEdit ? (course?.name ?? "Chỉnh sửa") : "Tạo mới" },
      ]}
      leadingAction={
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      }
      action={
        <div className="flex items-center gap-3">
          <div id="course-form-actions-portal" className="flex items-center gap-2" />

          {isEdit && course ? (
            <Button
              type="button"
              disabled={
                (course.status === "draft" &&
                  submitForReviewMutation.isPending) ||
                (course.status === "approved" &&
                  publishCourseMutation.isPending) ||
                (course.status !== "draft" && course.status !== "approved")
              }
              onClick={() => {
                void handleCourseStatusAction();
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              {course.status === "draft"
                ? submitForReviewMutation.isPending
                  ? "Đang gửi duyệt..."
                  : "Gửi duyệt khóa học"
                : course.status === "pending"
                  ? "Đang chờ admin duyệt"
                  : course.status === "approved"
                    ? publishCourseMutation.isPending
                      ? "Đang publish..."
                      : "Publish khóa học"
                    : "Đã publish"}
            </Button>
          ) : null}
        </div>
      }
    >
      <CourseForm
        course={course}
        onSave={async (payload) => {
          if (isEdit && course) {
            await updateCourseMutation.mutateAsync({
              id: course.id,
              data: payload,
            });
            router.push(`/instructor/courses/${course.id}`);
            router.refresh();
            return;
          }

          if (!user?.id) {
            return;
          }

          const created = await createCourseMutation.mutateAsync(payload);
          router.push(`/instructor/courses/${created.id}`);
          router.refresh();
        }}
      />
    </ManagementPageShell>
  );
}
