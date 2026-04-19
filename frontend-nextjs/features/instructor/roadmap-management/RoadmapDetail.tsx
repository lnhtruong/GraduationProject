"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ManagementPageShell } from "@/features/instructor/course-management/components/ManagementPageShell";
import { RoadmapInfoForm } from "./components/roadmap-detail/RoadmapInfoForm";
import { RoadmapCourseSection } from "./components/roadmap-detail/RoadmapCourseSection";
import {
  AddRoadmapCourseDialog,
  DeleteRoadmapDialog,
} from "./components/roadmap-detail/RoadmapDialogs";
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
    deleteRoadmapOpen,
    sensors,
    isSaving,
    isDeleting,
    setAddCourseOpen,
    setCourseSearch,
    setDeleteRoadmapOpen,
    setName,
    setDescription,
    handleBackToRoadmapList,
    handleDeleteRoadmap,
    handleConfirmDeleteRoadmap,
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
        title="Đang tải lộ trình..."
        description="Lấy dữ liệu lộ trình và khóa học đã gắn."
        breadcrumbs={[
          { label: "Lộ trình", href: "/instructor/roadmaps" },
          { label: "Chi tiết" },
        ]}
      >
        <div className="space-y-4 p-4 sm:p-5">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </ManagementPageShell>
    );
  }

  if (!roadmap) {
    return (
      <ManagementPageShell
        title="Không tìm thấy lộ trình"
        description="Lộ trình không tồn tại hoặc đã bị xóa."
        breadcrumbs={[
          { label: "Lộ trình", href: "/instructor/roadmaps" },
          { label: "Chi tiết" },
        ]}
      >
        <div className="space-y-3 p-4 text-sm text-muted-foreground sm:p-5">
          Không thể mở dữ liệu lộ trình.
          <div>
            <Button asChild variant="outline" size="sm">
              <Link href="/instructor/roadmaps">Quay lại danh sách</Link>
            </Button>
          </div>
        </div>
      </ManagementPageShell>
    );
  }

  return (
    <ManagementPageShell
      title={`Lộ trình: ${roadmap.name}`}
      description="Trang chi tiết lộ trình giúp bạn quản lý nội dung rõ ràng và dễ mở rộng."
      breadcrumbs={[
        { label: "Lộ trình", href: "/instructor/roadmaps" },
        { label: roadmap.name },
      ]}
      leadingAction={
        <Button variant="outline" size="sm" onClick={handleBackToRoadmapList}>
          Quay lại danh sách
        </Button>
      }
      action={
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => void handleDeleteRoadmap()}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Xóa lộ trình
          </Button>
          <Button type="submit" form="edit-roadmap-form" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 p-3 sm:space-y-5 sm:p-4 lg:p-5">
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

      <DeleteRoadmapDialog
        open={deleteRoadmapOpen}
        roadmapName={roadmap?.name}
        isDeleting={isDeleting}
        onOpenChange={setDeleteRoadmapOpen}
        onConfirm={() => void handleConfirmDeleteRoadmap()}
      />

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
