"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  BarChart2,
  Globe,
  Tag,
  Wallet,
  NotebookText,
  Target,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CourseFormValues, InstructorCourse } from "../types";

interface Props {
  course?: InstructorCourse | null;
  onSave?: (payload: CourseFormValues) => Promise<void> | void;
}

const LEVEL_OPTIONS: CourseFormValues["level"][] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const DEFAULT_DURATION = "00:00:00";

export function CourseForm({ course, onSave }: Props) {
  const initialValues = useMemo<CourseFormValues>(
    () => ({
      name: course?.name ?? "",
      description: course?.description ?? "",
      categories: course?.categories ?? [],
      level: course?.level ?? "Beginner",
      duration: course?.duration ?? DEFAULT_DURATION,
      language: course?.language ?? "Tiếng Việt",
      price: course?.price ?? 0,
      status: course?.status ?? "draft",
    }),
    [course],
  );

  const { register, control, handleSubmit, reset } = useForm<CourseFormValues>({
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const isEdit = Boolean(course);

  const nameValue = useWatch({ control, name: "name" });
  const descriptionValue = useWatch({ control, name: "description" });
  const categoriesValue = useWatch({ control, name: "categories" }) ?? [];
  const levelValue = useWatch({ control, name: "level" });
  const languageValue = useWatch({ control, name: "language" });
  const priceValue = useWatch({ control, name: "price" });

  const onSubmit = async (values: CourseFormValues) => {
    await onSave?.({
      name: values.name.trim(),
      description: values.description.trim(),
      categories: values.categories.map((item) => item.trim()).filter(Boolean),
      level: values.level,
      duration: values.duration.trim(),
      language: values.language.trim(),
      price: Number(values.price || 0),
    });

    toast.success(isEdit ? "Đã cập nhật khóa học" : "Đã tạo khóa học mới");
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]"
    >
      <div className="space-y-4">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <NotebookText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-base font-semibold">Thông tin chính</p>
                <p className="text-xs text-muted-foreground">
                  Đặt tên và mô tả để learner hiểu khóa học trong 10 giây đầu.
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tên khóa học</label>
              <Input
                {...register("name", { required: true })}
                placeholder="VD: React từ đầu"
                className="h-11"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                {...register("description", { required: true })}
                placeholder="Mô tả ngắn về khóa học"
                className="min-h-40"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-base font-semibold">Định vị khóa học</p>
                <p className="text-xs text-muted-foreground">
                  Chọn audience và trình độ phù hợp cho khóa học.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Danh mục</label>
                <Controller
                  name="categories"
                  control={control}
                  render={({ field }) => (
                    <Input
                      value={(field.value ?? []).join(", ")}
                      onChange={(event) => {
                        field.onChange(
                          event.target.value
                            .split(",")
                            .map((item) => item.trim())
                            .filter(Boolean),
                        );
                      }}
                      placeholder="VD: Frontend, React"
                      className="h-11"
                    />
                  )}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Trình độ</label>
                <Controller
                  name="level"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11 w-full">
                        <SelectValue placeholder="Chọn trình độ" />
                      </SelectTrigger>
                      <SelectContent>
                        {LEVEL_OPTIONS.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Ngôn ngữ</label>
                <Input
                  {...register("language")}
                  placeholder="Tiếng Việt"
                  className="h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div>
                <p className="text-base font-semibold">Thiết lập thương mại</p>
                <p className="text-xs text-muted-foreground">
                  Đặt giá bán và chiến lược phát hành.
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Giá bán (VND)</label>
              <Input
                type="number"
                {...register("price", {
                  setValueAs: (value) => Number(value || 0),
                })}
                min="0"
                className="h-11"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <Card className="overflow-hidden border-border/60 bg-[#1c1d1f] text-white shadow-lg shadow-black/20">
          <CardContent className="space-y-4 p-5">
            <div className="rounded-xl bg-linear-to-br from-primary/35 via-primary/10 to-transparent p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-300">
                Live Preview
              </p>
              <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-white">
                {nameValue || "Khóa học mới"}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm text-slate-300">
                {descriptionValue?.trim() ||
                  "Mô tả khóa học sẽ hiển thị ở đây để bạn xem trước cách learner nhìn thấy nội dung."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/60 px-2 py-1.5">
                <BarChart2 className="h-3.5 w-3.5" />
                {levelValue}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/60 px-2 py-1.5">
                <Globe className="h-3.5 w-3.5" />
                {languageValue || "Tiếng Việt"}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-700/60 px-2 py-1.5">
                <Wallet className="h-3.5 w-3.5" />
                {Number(priceValue ?? 0).toLocaleString("vi-VN")}đ
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {categoriesValue.length ? (
                categoriesValue.map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="border-slate-700 bg-slate-800 text-slate-200"
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {category}
                  </Badge>
                ))
              ) : (
                <Badge
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                >
                  Chưa có danh mục
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          {isEdit ? "Lưu thay đổi" : "Tạo khóa học"}
        </Button>

        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
          Sau khi tạo khóa học, bạn có thể thêm lesson và quiz ở các trang quản
          lý chi tiết. Thời lượng và trạng thái sẽ được hệ thống xử lý mặc định.
        </div>
      </div>
    </form>
  );
}
