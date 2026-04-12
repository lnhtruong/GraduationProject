"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UseFormRegisterReturn } from "react-hook-form";

interface Props {
  isEdit: boolean;
  titleRegister: UseFormRegisterReturn;
  descriptionRegister: UseFormRegisterReturn;
  durationRegister: UseFormRegisterReturn;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function LessonMetadataForm({
  isEdit,
  titleRegister,
  descriptionRegister,
  durationRegister,
  onSubmit,
  isSubmitting,
}: Props) {
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="space-y-3 flex-1">
        <div className="grid gap-2">
          <Label className="text-sm font-medium">Tên bài học</Label>
          <Input
            {...titleRegister}
            placeholder="VD: Kiểu dữ liệu trong Python"
            className="text-sm"
          />
        </div>

        <div className="grid gap-2">
          <Label className="text-sm font-medium">Mô tả ngắn</Label>
          <Textarea
            {...descriptionRegister}
            placeholder="Tóm tắt nội dung bài học"
            className="min-h-24 text-sm"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Loại nội dung</Label>
            <Input
              value="video"
              readOnly
              disabled
              className="bg-muted/30 text-sm"
            />
          </div>
          <div className="grid gap-2">
            <Label className="text-sm font-medium">Thời lượng (phút)</Label>
            <Input
              type="number"
              min="1"
              {...durationRegister}
              className="text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 pt-1">
        <Badge variant="outline" className="shrink-0 text-[11px]">
          {isEdit ? "Editing" : "New lesson"}
        </Badge>
        <Button
          type="submit"
          className="h-9 px-4 shadow-md whitespace-nowrap"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isEdit ? "Lưu bài học" : "Tạo bài học"}
        </Button>
      </div>
    </div>
  );
}
