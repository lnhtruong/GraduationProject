import { AppPageHeader } from "@/features/_shared/components/AppPageHeader";
import { Button } from "@/components/ui/button";
import { FolderKanban, Plus } from "lucide-react";

interface WorkspaceHeaderProps {
  onCreateProject: () => void;
  projectCount: number;
}

export function WorkspaceHeader({
  onCreateProject,
  projectCount,
}: WorkspaceHeaderProps) {
  return (
    <AppPageHeader
      eyebrow="Không gian làm việc"
      title="Workspace của bạn"
      description={`Tổng cộng ${projectCount} dự án. Quản lý bản nháp, dự án đã lưu và video đã hoàn thành.`}
      icon={<FolderKanban className="h-5 w-5" />}
      actions={
        <Button size="sm" onClick={onCreateProject}>
          <Plus className="mr-1.5 h-4 w-4" />
          Tạo dự án mới
        </Button>
      }
    />
  );
}
