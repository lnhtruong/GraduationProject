import { Route } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    <form id={formId} onSubmit={onSubmit}>
      <Card className="border-border/60 shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Route className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Thông tin chính</h2>
              <p className="text-sm text-muted-foreground">
                Đặt tên và mô tả để học viên hiểu lộ trình trước khi bắt đầu.
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label className="text-sm font-medium">
                Tên lộ trình <span className="text-destructive">*</span>
              </Label>
              <Input
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="VD: Backend JavaScript cho người mới"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-medium">Mô tả</Label>
              <Textarea
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="Mục tiêu học, trình độ phù hợp, kết quả sau khi hoàn thành..."
                className="min-h-32 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
