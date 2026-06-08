"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UseFormRegisterReturn, FieldErrors } from "react-hook-form";
import type { LessonFormValues } from "../../types";
import { cn } from "@/lib/utils";

interface Props {
  titleRegister: UseFormRegisterReturn;
  descriptionRegister: UseFormRegisterReturn;
  errors?: FieldErrors<LessonFormValues>;
}

export function LessonMetadataForm({
  titleRegister,
  descriptionRegister,
  errors,
}: Props) {
  return (
    <div className="mb-4 space-y-3">
      <div className="grid gap-2">
        <Label className="text-sm font-medium">
          Tên bài học <span className="text-destructive">*</span>
        </Label>
        <Input
          {...titleRegister}
          placeholder="VD: Kiểu dữ liệu trong Python"
          className={cn("text-sm", errors?.title && "border-destructive focus-visible:ring-destructive")}
        />
        {errors?.title && (
          <p className="text-xs text-destructive mt-0.5">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label className="text-sm font-medium">
          Mô tả ngắn <span className="text-destructive">*</span>
        </Label>
        <Textarea
          {...descriptionRegister}
          placeholder="Tóm tắt nội dung bài học"
          className={cn("min-h-24 text-sm", errors?.description && "border-destructive focus-visible:ring-destructive")}
        />
        {errors?.description && (
          <p className="text-xs text-destructive mt-0.5">{errors.description.message}</p>
        )}
      </div>
    </div>
  );
}
