import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { InstructorCourse } from "@/features/instructor/course-management/types";

interface DeleteRoadmapDialogProps {
  open: boolean;
  roadmapName?: string;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

interface AddRoadmapCourseDialogProps {
  open: boolean;
  search: string;
  coursesLoading: boolean;
  availableCourses: InstructorCourse[];
  onOpenChange: (open: boolean) => void;
  onSearchChange: (value: string) => void;
  onAddCourse: (courseId: number) => void;
}

function stripHtml(value?: string | null) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function DeleteRoadmapDialog({
  open,
  roadmapName,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteRoadmapDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xóa lộ trình</DialogTitle>
          <DialogDescription>
            Lộ trình {roadmapName ? `"${roadmapName}"` : "này"} sẽ bị xóa khỏi
            khu vực quản lý. Thao tác này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Đang xóa..." : "Xóa lộ trình"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AddRoadmapCourseDialog({
  open,
  search,
  coursesLoading,
  availableCourses,
  onOpenChange,
  onSearchChange,
  onAddCourse,
}: AddRoadmapCourseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Thêm khóa học</DialogTitle>
          <DialogDescription>
            Chọn khóa học để đưa vào lộ trình.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm theo tên hoặc mô tả khóa học..."
              className="h-11 rounded-xl pl-10"
            />
          </div>

          <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
            {coursesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : availableCourses.length ? (
              availableCourses.map((course) => (
                <div
                  key={course.id}
                  className="grid gap-3 rounded-2xl border border-border/60 bg-card p-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center"
                >
                  <div className="relative aspect-video overflow-hidden rounded-xl border border-border/60 bg-muted">
                    {course.thumbnailUrl ? (
                      <Image
                        src={course.thumbnailUrl}
                        alt={course.name}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="line-clamp-2 font-semibold">{course.name}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {stripHtml(course.description) || "Chưa có mô tả"}
                    </p>
                  </div>
                  <Button onClick={() => onAddCourse(course.id)}>Thêm</Button>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 p-5 text-sm text-muted-foreground">
                Không còn khóa học phù hợp để thêm.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
