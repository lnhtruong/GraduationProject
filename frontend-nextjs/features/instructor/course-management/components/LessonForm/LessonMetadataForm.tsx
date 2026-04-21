"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UseFormRegisterReturn } from "react-hook-form";

interface Props {
  titleRegister: UseFormRegisterReturn;
  descriptionRegister: UseFormRegisterReturn;
}

export function LessonMetadataForm({
  titleRegister,
  descriptionRegister,
}: Props) {
  return (
    <div className="mb-4 space-y-3">
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
    </div>
  );
}
