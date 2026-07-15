import { AppPageHeader } from "@/features/_shared/components/AppPageHeader";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw, Library } from "lucide-react";

interface LibraryHeaderProps {
  totalCount: number;
  onOpenEditor: () => void;
  onRefresh: () => void;
}

export function LibraryHeader({
  totalCount,
  onOpenEditor,
  onRefresh,
}: LibraryHeaderProps) {
  return (
    <AppPageHeader
      eyebrow="Kho media cá nhân"
      title="Library của bạn"
      description={`Tổng cộng ${totalCount} tệp. Xem lại video highlight, video mascot và hình ảnh đã tạo.`}
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
