import { AppPageHeader } from "@/features/_shared/components/AppPageHeader";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Library } from "lucide-react";

interface LibraryHeaderProps {
  onOpenEditor: () => void;
  onRefresh: () => void;
}

export function LibraryHeader({
  onOpenEditor,
  onRefresh,
}: LibraryHeaderProps) {
  return (
    <AppPageHeader
      eyebrow="Kho media cá nhân"
      title="Library của bạn"
      icon={<Library className="h-5 w-5" />}
      actions={
        <>
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Làm mới
          </Button>
          <Button size="sm" onClick={onOpenEditor}>
            <Plus className="mr-1.5 h-4 w-4" />
            Mở editor
          </Button>
        </>
      }
    />
  );
}
