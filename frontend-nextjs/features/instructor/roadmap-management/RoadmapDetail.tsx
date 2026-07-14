"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ManagementPageShell } from "@/features/instructor/course-management/components/ManagementPageShell";
import { RoadmapInfoForm } from "./components/roadmap-detail/RoadmapInfoForm";
import { RoadmapCourseSection } from "./components/roadmap-detail/RoadmapCourseSection";
import { AddRoadmapCourseDialog } from "./components/roadmap-detail/RoadmapDialogs";
import { useRoadmapDetailEditor } from "./components/roadmap-detail/useRoadmapDetailEditor";

interface Props {
  roadmapId: number;
}

export default function RoadmapDetail({ roadmapId }: Props) {
  const {
    roadmap,
    isLoading,
    coursesLoading,
    name,
    description,
    roadmapCourses,
    activeDragCourseItem,
    availableCourses,
    addCourseOpen,
    courseSearch,
    sensors,
    isSaving,
    setAddCourseOpen,
    setCourseSearch,
    setName,
    setDescription,
    handleBackToRoadmapList,
    handleSubmitRoadmapForm,
    handleMoveCourse,
    handleRemoveCourse,
    handleAddCourse,
    handleDragStart,
    handleDragCancel,
    handleDragEnd,
  } = useRoadmapDetailEditor(roadmapId);

  if (isLoading) {
    return (
      <ManagementPageShell
        noCard
        title="Đang tải lộ trình..."
        description="Đang lấy thông tin lộ trình và danh sách khóa học."
        breadcrumbs={[
          { label: "Quản lý lộ trình", href: "/instructor/roadmaps" },
          { label: "Chi tiết" },
        ]}
      >
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </ManagementPageShell>
    );
  }

  if (!roadmap) {
    return (
      <ManagementPageShell
        noCard
        title="Không tìm thấy lộ trình"
        description="Lộ trình không tồn tại hoặc đã bị xóa."
        breadcrumbs={[
          { label: "Quản lý lộ trình", href: "/instructor/roadmaps" },
          { label: "Chi tiết" },
        ]}
        leadingAction={
          <Button variant="outline" size="icon" asChild aria-label="Quay lại">
            <Link href="/instructor/roadmaps">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
        }
      >
        <div className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
          Không thể mở dữ liệu lộ trình này.
        </div>
      </ManagementPageShell>
    );
  }

  return (
    <ManagementPageShell
      noCard
      title="Chỉnh sửa lộ trình"
      description="Cập nhật thông tin lộ trình và sắp xếp thứ tự khóa học."
      breadcrumbs={[
        { label: "Quản lý lộ trình", href: "/instructor/roadmaps" },
        { label: roadmap.name },
      ]}
      leadingAction={
        <Button
          variant="outline"
          size="icon"
          onClick={handleBackToRoadmapList}
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
      }
      action={
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
          <Button
            type="submit"
            form="edit-roadmap-form"
            disabled={isSaving}
            className="h-11 rounded-xl px-5"
          >
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <RoadmapInfoForm
          formId="edit-roadmap-form"
          name={name}
          description={description}
          onSubmit={(event) => void handleSubmitRoadmapForm(event)}
          onNameChange={setName}
          onDescriptionChange={setDescription}
        />

        <RoadmapCourseSection
          roadmapCourses={roadmapCourses}
          activeDragCourseItem={activeDragCourseItem}
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
          onMoveCourse={handleMoveCourse}
          onRemoveCourse={handleRemoveCourse}
          onOpenAddCourse={() => setAddCourseOpen(true)}
        />
      </div>

      <AddRoadmapCourseDialog
        open={addCourseOpen}
        search={courseSearch}
        coursesLoading={coursesLoading}
        availableCourses={availableCourses}
        onOpenChange={setAddCourseOpen}
        onSearchChange={setCourseSearch}
        onAddCourse={handleAddCourse}
      />
    </ManagementPageShell>
  );
}
