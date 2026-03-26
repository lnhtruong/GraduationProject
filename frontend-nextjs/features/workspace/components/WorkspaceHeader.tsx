import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

interface WorkspaceHeaderProps {
  onCreateProject: () => void;
  isCreatingProject: boolean;
  projectCount: number;
}

export function WorkspaceHeader({
  onCreateProject,
  isCreatingProject,
  projectCount,
}: WorkspaceHeaderProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Không gian quản lý dự án
          </p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Workspace của bạn
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Tổng cộng {projectCount} dự án. Chọn một dự án để tiếp tục chỉnh sửa,
            hoặc tạo mới chỉ với một lần bấm.
          </p>
        </div>

        <Button
          size="lg"
          onClick={onCreateProject}
          disabled={isCreatingProject}
          className="h-12 px-6 text-base shadow-lg shadow-primary/30"
        >
          <Plus className="mr-2 h-5 w-5" />
          {isCreatingProject ? "Đang tạo dự án..." : "Tạo dự án mới"}
        </Button>
      </div>
    </div>
  );
}
