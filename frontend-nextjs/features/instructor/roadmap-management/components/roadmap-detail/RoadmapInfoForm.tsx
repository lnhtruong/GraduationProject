import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RoadmapInfoFormProps {
  formId: string;
  name: string;
  description: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
}

export function RoadmapInfoForm({
  formId,
  name,
  description,
  onSubmit,
  onNameChange,
  onDescriptionChange,
}: RoadmapInfoFormProps) {
  return (
    <form id={formId} className="space-y-5" onSubmit={onSubmit}>
      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div>
            <h3 className="text-base font-semibold">Thông tin lộ trình</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Chỉnh sửa tên và mô tả lộ trình của bạn.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Tên lộ trình</Label>
              <Input
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="VD: Backend JavaScript cho người mới"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Mô tả</Label>
              <Input
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="Mục tiêu, level, nội dung trọng tâm..."
              />
            </div>
          </div>

          <div className="border-t border-border/60 pt-4 text-xs text-muted-foreground">
            Cập nhật thông tin và sắp xếp khóa học xong rồi bấm{" "}
            <strong>Lưu thay đổi</strong> ở góc trên bên phải để áp dụng.
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
