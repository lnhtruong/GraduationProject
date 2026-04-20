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
  useQuickPublishCourse,
  useUpdateCourse,
} from "./api/course-management.hooks";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface Props {
  courseId?: number;
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
  const quickPublishCourseMutation = useQuickPublishCourse();

  const handleQuickPublishCourse = async () => {
    if (!course || course.status === "publish") {
      return;
    }

    try {
      await quickPublishCourseMutation.mutateAsync({
        id: course.id,
        status: course.status,
      });
      toast.success("Đã public khóa học");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Public thất bại";
      toast.error(message);
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
        isEdit && course && course.status !== "publish" ? (
          <Button
            type="button"
            disabled={quickPublishCourseMutation.isPending}
            onClick={() => {
              void handleQuickPublishCourse();
            }}
          >
            <Upload className="mr-2 h-4 w-4" />
            {quickPublishCourseMutation.isPending
              ? "Đang public..."
              : "Public khóa học"}
          </Button>
        ) : null
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
