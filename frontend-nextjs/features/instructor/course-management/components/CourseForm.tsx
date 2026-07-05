"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { courseFormSchema } from "../schemas";
import { toast } from "sonner";
import {
  BarChart2,
  Globe,
  Tag,
  NotebookText,
  Target,
  ShoppingBag,
  Star,
  Users,
  Clock,
  RefreshCw,
  Plus,
  X,
  GraduationCap,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import dynamic from "next/dynamic";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { CourseFormValues, InstructorCourse } from "../types";
import { formatMonthYear } from "@/features/courses/utils";
import { useCloudinaryDirectUpload } from "@/features/cloudinary";
import { sanitizeHtml } from "@/lib/sanitize-html";

const RichTextBoxCKE = dynamic(
  () => import("@/components/RichTextBoxCKE").then((mod) => mod.RichTextBoxCKE),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-40 rounded-xl border border-border/70 bg-card px-3 py-2 text-sm text-muted-foreground animate-pulse flex items-center justify-center">
        Đang tải trình soạn thảo...
      </div>
    ),
  }
);

interface Props {
  course?: InstructorCourse | null;
  onSave?: (payload: CourseFormValues) => Promise<void> | void;
}

const LANGUAGE_OPTIONS = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "Tiếng Anh" },
] as const;

const LEVEL_OPTIONS: CourseFormValues["level"][] = [
  "Beginner",
  "Intermediate",
  "Advanced",
];

const LEVEL_LABELS: Record<CourseFormValues["level"], string> = {
  Beginner: "Sơ cấp",
  Intermediate: "Trung cấp",
  Advanced: "Cao cấp",
};

const DEFAULT_DURATION = "00:00:00";

export function CourseForm({ course, onSave }: Props) {
  const { user } = useAuth();
  const [categoryInput, setCategoryInput] = useState("");
  const [filledAt, setFilledAt] = useState<string | null>(null);
  const formOpenedAt = useMemo(() => new Date().toISOString(), []);

  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPortalTarget(document.getElementById("course-form-actions-portal"));
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadImage, isPending: isUploading } =
    useCloudinaryDirectUpload();

  const normalizeLanguageValue = (value?: string | null): string => {
    if (!value) return "vi";
    const normalized = value.trim().toLowerCase();
    if (normalized === "vi" || normalized.includes("việt")) return "vi";
    if (normalized === "en" || normalized.includes("anh")) return "en";
    return "vi";
  };

  const getLanguageLabel = (value?: string) => {
    return LANGUAGE_OPTIONS.find((item) => item.value === value)?.label ??
      "Tiếng Việt (vi)";
  };

  const getLevelLabel = (value?: CourseFormValues["level"]) => {
    return value ? LEVEL_LABELS[value] : LEVEL_LABELS.Beginner;
  };

  const initialValues = useMemo<CourseFormValues>(
    () => ({
      name: course?.name ?? "",
      description: course?.description ?? "",
      thumbnailUrl: course?.thumbnailUrl ?? "",
      categories: course?.categories ?? [],
      level: course?.level ?? "Beginner",
      duration: course?.duration ?? DEFAULT_DURATION,
      language: normalizeLanguageValue(course?.language),
      price: course?.price ?? 0,
      status: course?.status ?? "draft",
    }),
    [course],
  );

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: initialValues,
  });

  const handleThumbnailUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadImage({
        file,
        folderName: "course-thumbnails",
        resourceType: "image",
      });
      if (result?.secure_url) {
        setValue("thumbnailUrl", result.secure_url);
        toast.success("Tải ảnh lên thành công!");
      } else {
        toast.error("Không nhận được URL ảnh từ máy chủ.");
      }
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error
          ? error.message
          : String(error || "Lỗi không xác định");
      toast.error(`Tải ảnh lên thất bại: ${errMsg}`);
    }
  };

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const isEdit = Boolean(course);

  const nameValue = useWatch({ control, name: "name" });
  const descriptionValue = useWatch({ control, name: "description" });
  const thumbnailUrlValue = useWatch({ control, name: "thumbnailUrl" });
  const categoriesValue = useWatch({ control, name: "categories" }) ?? [];
  const levelValue = useWatch({ control, name: "level" });
  const languageValue = useWatch({ control, name: "language" });
  const priceValue = useWatch({ control, name: "price" });
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  const instructorName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "Giảng viên của bạn";
  const previewUpdatedAt = course?.updated_at ?? filledAt ?? formOpenedAt;
  const previewDescriptionHtml = (() => {
    const html = descriptionValue?.trim() ?? "";
    const plain = html.replace(/<[^>]*>/g, "").trim();
    if (!plain) {
      return "<p>Mô tả khóa học sẽ hiển thị ở đây để bạn xem trước cách learner nhìn thấy nội dung.</p>";
    }
    return html;
  })();
  const safePreviewDescriptionHtml = useMemo(
    () => sanitizeHtml(previewDescriptionHtml),
    [previewDescriptionHtml],
  );

  useEffect(() => {
    if (filledAt) return;

    const plainDescription = (descriptionValue ?? "")
      .replace(/<[^>]*>/g, "")
      .trim();

    const hasInput =
      Boolean(nameValue?.trim()) ||
      Boolean(plainDescription) ||
      categoriesValue.length > 0 ||
      Number(priceValue ?? 0) > 0 ||
      (languageValue ?? "").trim() !== "vi" ||
      levelValue !== "Beginner";

    if (hasInput) {
      const frame = window.requestAnimationFrame(() => {
        setFilledAt(new Date().toISOString());
      });

      return () => {
        window.cancelAnimationFrame(frame);
      };
    }
  }, [
    categoriesValue.length,
    descriptionValue,
    filledAt,
    languageValue,
    levelValue,
    nameValue,
    priceValue,
  ]);

  const addCategory = (
    rawValue: string,
    current: string[],
    onChange: (value: string[]) => void,
  ) => {
    const normalized = rawValue.trim();
    if (!normalized) return;

    const exists = current.some(
      (item) => item.toLowerCase() === normalized.toLowerCase(),
    );

    if (exists) {
      setCategoryInput("");
      return;
    }

    onChange([...current, normalized]);
    setCategoryInput("");
  };

  const removeCategory = (
    target: string,
    current: string[],
    onChange: (value: string[]) => void,
  ) => {
    onChange(current.filter((item) => item !== target));
  };

  const onSubmit = async (values: CourseFormValues) => {
    await onSave?.({
      name: values.name.trim(),
      description: values.description.trim(),
      thumbnailUrl: values.thumbnailUrl?.trim() || null,
      categories: values.categories.map((item) => item.trim()).filter(Boolean),
      level: values.level,
      duration: values.duration.trim(),
      language: values.language.trim(),
      price: Number(values.price || 0),
    });

    toast.success(isEdit ? "Đã cập nhật khóa học" : "Đã tạo khóa học mới");
  };

  /* ─── Preview Panel (rendered inside Sheet) ─── */
  const previewContent = (
    <div className="space-y-5">
      {/* Course Image Preview */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/60 bg-muted/30 flex items-center justify-center">
        {thumbnailUrlValue ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrlValue}
            alt={nameValue || "Thumbnail Preview"}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
              const fallback = (e.target as HTMLElement).nextElementSibling;
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
        ) : null}
        <div className={cn(
          "absolute inset-0 flex flex-col items-center justify-center text-muted-foreground",
          thumbnailUrlValue ? "hidden" : ""
        )}>
          <GraduationCap className="h-10 w-10 stroke-1 mb-1" />
          <span className="text-xs">Chưa có ảnh đại diện</span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="line-clamp-2 text-lg font-semibold text-foreground">
          {nameValue || "Khóa học mới"}
        </h3>
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 max-h-48 overflow-y-auto">
          <div
            className="course-preview-html text-sm text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: safePreviewDescriptionHtml }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-bold text-primary">5.0</span>
          <div className="flex items-center gap-0.5">
            {stars.map((star) => (
              <Star
                key={star}
                className="h-3.5 w-3.5 fill-amber-500 text-amber-500"
              />
            ))}
          </div>
          <span>(1.234 đánh giá)</span>
          <span className="text-border">•</span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            1.234 học viên
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Tạo bởi <span className="font-medium text-primary">{instructorName}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          {getLanguageLabel(languageValue)}
        </span>
        <span className="flex items-center gap-1.5">
          <BarChart2 className="h-3.5 w-3.5" />
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px]",
              levelValue === "Beginner" &&
                "border-primary/30 bg-primary/10 text-primary",
              levelValue === "Intermediate" &&
                "border-orange-400/30 bg-orange-400/10 text-orange-500",
              levelValue === "Advanced" &&
                "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {getLevelLabel(levelValue)}
          </span>
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          12h 30p
        </span>
        <span className="flex items-center gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Cập nhật {formatMonthYear(previewUpdatedAt)}
        </span>
      </div>

      <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Giá dự kiến hiển thị
        </p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="text-xl font-bold text-primary">
            {Number(priceValue ?? 0).toLocaleString("vi-VN")}đ
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categoriesValue.length ? (
          categoriesValue.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="border-border/60 bg-muted text-foreground"
            >
              <Tag className="mr-1 h-3 w-3" />
              {category}
            </Badge>
          ))
        ) : (
          <Badge variant="outline" className="border-border/60 text-muted-foreground">
            Chưa có danh mục
          </Badge>
        )}
      </div>
    </div>
  );

  return (
    <form
      id="course-form"
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-6"
    >
      {portalTarget && createPortal(
        <>
          <Sheet>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                Xem trước
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Xem trước khóa học</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                {previewContent}
              </div>
            </SheetContent>
          </Sheet>

          <Button type="submit" form="course-form" className="min-w-[120px]">
            {isEdit ? "Lưu thay đổi" : "Tạo khóa học"}
          </Button>
        </>,
        portalTarget
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ─── Cột trái: Thông tin & Phân loại (8/12) ─── */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Thông tin chính */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <NotebookText className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold">Thông tin chính</p>
                  <p className="text-xs text-muted-foreground">
                    Đặt tên và mô tả để học viên hiểu khóa học trong 10 giây đầu.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Tên khóa học <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("name")}
                  placeholder="VD: React từ đầu"
                  className={cn("h-11", errors.name && "border-destructive focus-visible:ring-destructive")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-0.5">{errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Mô tả <span className="text-destructive">*</span>
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <RichTextBoxCKE
                      ref={field.ref}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Mô tả khóa học, bạn có thể copy paste từ các nền tảng khác..."
                      error={Boolean(errors.description)}
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-xs text-destructive mt-0.5">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Phân loại học tập */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold">Phân loại học tập</p>
                  <p className="text-xs text-muted-foreground">
                    Chọn trình độ, ngôn ngữ và danh mục của khóa học.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Trình độ</label>
                  <Controller
                    name="level"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger ref={field.ref} className="h-11 w-full">
                          <SelectValue placeholder="Chọn trình độ" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVEL_OPTIONS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {getLevelLabel(level)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">
                    Ngôn ngữ <span className="text-destructive">*</span>
                  </label>
                  <Controller
                    name="language"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger ref={field.ref} className={cn("h-11 w-full", errors.language && "border-destructive focus:ring-destructive")}>
                          <SelectValue placeholder="Chọn ngôn ngữ" />
                        </SelectTrigger>
                        <SelectContent>
                          {LANGUAGE_OPTIONS.map((language) => (
                            <SelectItem key={language.value} value={language.value}>
                              {language.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.language && (
                    <p className="text-xs text-destructive mt-0.5">{errors.language.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Danh mục <span className="text-destructive">*</span>
                </label>
                <Controller
                  name="categories"
                  control={control}
                  render={({ field }) => (
                    <div ref={field.ref} tabIndex={-1} className={cn("space-y-2 rounded-lg border bg-background p-2.5 focus:outline-none focus:ring-1", errors.categories ? "border-destructive focus:ring-destructive" : "border-input focus:ring-primary/30")}>
                      <div className="flex flex-wrap gap-1.5">
                        {(field.value ?? []).length ? (
                          (field.value ?? []).map((category) => (
                            <Badge
                              key={category}
                              variant="secondary"
                              className="gap-1 border-border/70 bg-muted text-foreground"
                            >
                              {category}
                              <button
                                type="button"
                                onClick={() =>
                                  removeCategory(
                                    category,
                                    field.value ?? [],
                                    field.onChange,
                                  )
                                }
                                className="rounded-full text-muted-foreground transition-colors hover:text-foreground"
                                aria-label={`Xóa danh mục ${category}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Chưa có danh mục nào.
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Input
                          value={categoryInput}
                          onChange={(event) => setCategoryInput(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === ",") {
                              event.preventDefault();
                              addCategory(
                                categoryInput,
                                field.value ?? [],
                                field.onChange,
                              );
                            }
                          }}
                          placeholder="Nhập danh mục rồi nhấn Enter"
                          className="h-10"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            addCategory(
                              categoryInput,
                              field.value ?? [],
                              field.onChange,
                            )
                          }
                          aria-label="Thêm danh mục"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                />
                {errors.categories && (
                  <p className="text-xs text-destructive mt-1">{errors.categories.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Cột phải: Thao tác & Thumbnail (4/12) ─── */}
        <div className="space-y-6 lg:col-span-4 lg:sticky lg:top-52 lg:h-fit">
          {/* Card 3: Giá bán & Thao tác */}
          {/* Card 3: Giá bán */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold">Giá bán khóa học</p>
                  <p className="text-xs text-muted-foreground">
                    Cấu hình giá bán dự kiến cho học viên.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Giá bán (VND)</label>
                <Input
                  type="number"
                  {...register("price", { valueAsNumber: true })}
                  min="0"
                  className={cn("h-11", errors.price && "border-destructive focus-visible:ring-destructive")}
                />
                {errors.price && (
                  <p className="text-xs text-destructive mt-0.5">{errors.price.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Ảnh đại diện (Thumbnail) */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-5 p-6">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold">Ảnh đại diện</p>
                  <p className="text-xs text-muted-foreground">
                    Tải lên hình ảnh đại diện cho khóa học.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                {thumbnailUrlValue ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnailUrlValue}
                        alt="Ảnh đại diện khóa học"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex-1 h-9 text-xs gap-1.5"
                      >
                        <RefreshCw className={cn("h-3.5 w-3.5", isUploading ? "animate-spin" : "")} />
                        {isUploading ? "Đang tải..." : "Thay đổi ảnh"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setValue("thumbnailUrl", "")}
                        disabled={isUploading}
                        className="h-9 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={cn(
                      "flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-8 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors text-muted-foreground text-center",
                      isUploading ? "pointer-events-none opacity-60" : ""
                    )}
                  >
                    {isUploading ? (
                      <RefreshCw className="h-8 w-8 stroke-1 animate-spin mb-2 text-primary" />
                    ) : (
                      <Plus className="h-8 w-8 stroke-1 mb-2" />
                    )}
                    <p className="text-xs font-semibold">
                      {isUploading ? "Đang tải ảnh..." : "Chọn ảnh từ thiết bị"}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Hỗ trợ PNG, JPG, JPEG (tỷ lệ 16:9)
                    </p>
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <style jsx global>{`
        .course-preview-html :where(h1, h2, h3, h4, h5, h6) {
          margin: 0.5rem 0;
          font-weight: 600;
          color: hsl(var(--foreground));
        }

        .course-preview-html :where(p, ul, ol, blockquote) {
          margin: 0.45rem 0;
        }

        .course-preview-html blockquote {
          margin: 0.6rem 0;
          border-left: 3px solid hsl(var(--primary));
          padding: 0.35rem 0 0.35rem 0.75rem;
          color: hsl(var(--foreground));
          background: hsl(var(--muted) / 0.28);
          border-radius: 0.25rem;
          font-style: italic;
        }

        .course-preview-html :where(ul, ol) {
          padding-left: 1rem;
        }

        .course-preview-html ul {
          list-style: disc;
        }

        .course-preview-html ol {
          list-style: decimal;
        }

        .course-preview-html :where(ul, ol) li::marker {
          color: hsl(var(--foreground));
        }

        .course-preview-html ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }

        .course-preview-html ul[data-type="taskList"] li::marker {
          content: "";
        }

        .course-preview-html table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.5rem 0;
        }

        .course-preview-html figure.table {
          margin: 0.55rem 0;
          overflow-x: auto;
        }

        .course-preview-html figure.table table {
          width: 100%;
          border-collapse: collapse;
        }

        .course-preview-html table td,
        .course-preview-html table th {
          border: 1px solid hsl(var(--foreground) / 0.35) !important;
          padding: 0.35rem 0.5rem;
          min-height: 36px;
          min-width: 96px;
          vertical-align: top;
        }

        .course-preview-html table th {
          background: hsl(var(--muted) / 0.45);
        }

        .course-preview-html a {
          color: hsl(var(--primary));
          text-decoration: underline;
        }
      `}</style>
    </form>
  );
}
