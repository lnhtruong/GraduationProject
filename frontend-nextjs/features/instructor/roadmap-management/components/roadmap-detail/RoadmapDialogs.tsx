import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search } from "lucide-react";
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
            Bạn có chắc chắn muốn xóa lộ trình{" "}
            <strong>&quot;{roadmapName}&quot;</strong>? Hành động này không thể
            hoàn tác.
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
            {isDeleting ? "Đang xóa..." : "Xóa"}
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
          <DialogTitle>Thêm khóa học vào lộ trình</DialogTitle>
          <DialogDescription>
            Chọn khóa học từ danh sách của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Tìm theo tên hoặc mô tả khóa học..."
              className="pl-9"
            />
          </div>

          <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1">
            {coursesLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
              </div>
            ) : availableCourses.length ? (
              availableCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{course.name}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {course.description}
                    </p>
                  </div>
                  <Button onClick={() => onAddCourse(course.id)}>Thêm</Button>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
                Không còn course nào phù hợp để thêm.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
