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
    <div className="mb-4 space-y-4">
      <div className="grid gap-1.5">
        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          Tên bài học <span className="text-destructive">*</span>
        </Label>
        <Input
          {...titleRegister}
          placeholder="VD: Kiểu dữ liệu trong Python"
          className={cn(
            "h-10 text-sm rounded-xl border-border focus-visible:ring-1 focus-visible:ring-primary/30",
            errors?.title && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {errors?.title && (
          <p className="text-xs text-destructive mt-0.5">{errors.title.message}</p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          Mô tả ngắn <span className="text-destructive">*</span>
        </Label>
        <Textarea
          {...descriptionRegister}
          placeholder="Tóm tắt nội dung bài học"
          className={cn(
            "min-h-24 text-sm rounded-xl border-border focus-visible:ring-1 focus-visible:ring-primary/30 resize-y",
            errors?.description && "border-destructive focus-visible:ring-destructive"
          )}
        />
        {errors?.description && (
          <p className="text-xs text-destructive mt-0.5">{errors.description.message}</p>
        )}
      </div>
    </div>
  );
}
