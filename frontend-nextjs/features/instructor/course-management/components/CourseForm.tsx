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
  RefreshCw,
  Plus,
  X,
  GraduationCap,
  Eye,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUserFacingErrorMessage } from "@/lib/user-facing-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  isCourseChangeRequestResult,
  type InstructorCourseMutationResult,
} from "../api/course-management.api";
import { formatMonthYear } from "@/features/courses/utils";
import { useCloudinaryDirectUpload } from "@/features/cloudinary";
import { useCourseCategories } from "@/features/courses/api/courseSearch.hooks";
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
  onSave?: (payload: CourseFormValues) => Promise<InstructorCourseMutationResult | void> | InstructorCourseMutationResult | void;
}

function getCourseSaveErrorMessage(error: unknown) {
  const responseMessage = (error as {
    response?: { data?: { message?: unknown } };
  }).response?.data?.message;

  if (
    typeof responseMessage === "string" &&
    responseMessage.trim() &&
    !/request failed|status code|service unavailable|internal server error/i.test(responseMessage)
  ) {
    return responseMessage;
  }

  return getUserFacingErrorMessage(error, "Không thể lưu khóa học. Vui lòng thử lại.");
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
const CATEGORY_SUGGESTION_LIMIT = 5;
const CATEGORY_SUGGESTION_EXPANDED_LIMIT = 14;

function formatVndInput(value?: number | null) {
  const amount = Number(value ?? 0);
  return amount.toLocaleString("vi-VN");
}

function parseVndInput(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export function CourseForm({ course, onSave }: Props) {
  const { user } = useAuth();
  const [categoryInput, setCategoryInput] = useState("");
  const [showAllCategorySuggestions, setShowAllCategorySuggestions] =
    useState(false);
  const { data: categorySuggestions = [] } = useCourseCategories();
  const [filledAt, setFilledAt] = useState<string | null>(null);
  const [confirmValues, setConfirmValues] = useState<CourseFormValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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
    if (normalized === "vi" || normalized === "vietnamese" || normalized.includes("việt")) return "vi";
    if (normalized === "en" || normalized === "english" || normalized.includes("anh")) return "en";
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

  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<CourseFormValues>({
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
        type: "thumbnail_course",
      });
      if (result?.secure_url) {
        setValue("thumbnailUrl", result.secure_url, {
          shouldDirty: true,
          shouldValidate: true,
        });
      } else {
        toast.error("Không nhận được URL ảnh từ máy chủ.");
      }
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error
          ? error.message
          : String(error || "Lỗi không xác định");
      console.error("Upload course thumbnail failed:", errMsg);
    } finally {
      event.target.value = "";
    }
  };

  useEffect(() => {
    reset(initialValues);
  }, [initialValues, reset]);

  const isEdit = Boolean(course);

  const nameValue = useWatch({ control, name: "name" });
  const descriptionValue = useWatch({ control, name: "description" });
  const thumbnailUrlValue = useWatch({ control, name: "thumbnailUrl" });
  const rawCategoriesValue = useWatch({ control, name: "categories" });
  const categoriesValue = useMemo(
    () => rawCategoriesValue ?? [],
    [rawCategoriesValue],
  );
  const levelValue = useWatch({ control, name: "level" });
  const languageValue = useWatch({ control, name: "language" });
  const priceValue = useWatch({ control, name: "price" });
  const instructorName =
    [user?.lastName, user?.firstName].filter(Boolean).join(" ").trim() ||
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
  const categorySuggestionItems = useMemo(() => {
    const selected = new Set(categoriesValue.map((item) => item.toLowerCase()));
    const keyword = categoryInput.trim().toLowerCase();
    const limit = showAllCategorySuggestions
      ? CATEGORY_SUGGESTION_EXPANDED_LIMIT
      : CATEGORY_SUGGESTION_LIMIT;

    return categorySuggestions
      .filter((category) => !selected.has(category.name.toLowerCase()))
      .filter((category) => !keyword || category.name.toLowerCase().includes(keyword))
      .slice(0, limit);
  }, [
    categoriesValue,
    categoryInput,
    categorySuggestions,
    showAllCategorySuggestions,
  ]);

  const hiddenCategorySuggestionCount = useMemo(() => {
    if (showAllCategorySuggestions) return 0;

    const selected = new Set(categoriesValue.map((item) => item.toLowerCase()));
    const keyword = categoryInput.trim().toLowerCase();

    const availableCount = categorySuggestions
      .filter((category) => !selected.has(category.name.toLowerCase()))
      .filter((category) => !keyword || category.name.toLowerCase().includes(keyword))
      .length;

    return Math.max(0, availableCount - CATEGORY_SUGGESTION_LIMIT);
  }, [
    categoriesValue,
    categoryInput,
    categorySuggestions,
    showAllCategorySuggestions,
  ]);

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
    setShowAllCategorySuggestions(false);
  };

  const removeCategory = (
    target: string,
    current: string[],
    onChange: (value: string[]) => void,
  ) => {
    onChange(current.filter((item) => item !== target));
  };

  const willCreateChangeRequest =
    isEdit && (course?.status === "publish" || course?.status === "approved");
  const changeRequestCopy =
    course?.status === "publish"
      ? {
          title: "Gửi bản chỉnh sửa khóa học?",
          description:
            "Khóa học này đang mở cho học viên. Bản đang học sẽ được giữ nguyên, còn phần bạn vừa sửa sẽ được gửi chờ duyệt trước khi cập nhật.",
          action: "Gửi bản chỉnh sửa",
        }
      : {
          title: "Gửi bản chỉnh sửa khóa học?",
          description:
            "Khóa học này đã được duyệt và đang chờ xuất bản. Phần bạn vừa sửa sẽ được gửi duyệt lại để giữ nội dung trước khi xuất bản luôn nhất quán.",
          action: "Gửi duyệt lại",
        };

  const saveCourseValues = async (values: CourseFormValues) => {
    setIsSaving(true);
    try {
      const result = await onSave?.({
        name: values.name.trim(),
        description: values.description.trim(),
        thumbnailUrl: values.thumbnailUrl?.trim() || null,
        categories: values.categories.map((item) => item.trim()).filter(Boolean),
        level: values.level,
        duration: values.duration.trim(),
        language: values.language.trim(),
        price: Number(values.price || 0),
      });

      const didCreateChangeRequest = isCourseChangeRequestResult(result);
      toast.success(
        didCreateChangeRequest
          ? "Đã gửi yêu cầu chỉnh sửa, đang chờ duyệt."
          : isEdit
            ? "Đã cập nhật khóa học"
            : "Đã tạo khóa học mới",
      );
    } catch (error) {
      toast.error(getCourseSaveErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };
  const onSubmit = async (values: CourseFormValues) => {
    if (willCreateChangeRequest) {
      setConfirmValues(values);
      return;
    }

    await saveCourseValues(values);
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
          {getLevelLabel(levelValue)}
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
            {Number(priceValue ?? 0) > 0
              ? `${Number(priceValue ?? 0).toLocaleString("vi-VN")}đ`
              : "Miễn phí"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {categoriesValue.length ? (
          categoriesValue.map((category) => (
            <span
              key={category}
              className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs text-foreground"
            >
              <Tag className="mr-1 h-3 w-3" />
              {category}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">
            Chưa có danh mục
          </span>
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

          <Button type="submit" form="course-form" className="min-w-[120px]" disabled={isSubmitting || isSaving || isUploading || !isDirty}>
            {isSubmitting || isSaving ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo khóa học"}
          </Button>
        </>,
        portalTarget
      )}

      <Dialog open={Boolean(confirmValues)} onOpenChange={(open) => !open && setConfirmValues(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {changeRequestCopy.title}
            </DialogTitle>
            <DialogDescription className="text-sm leading-6">
              {changeRequestCopy.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => setConfirmValues(null)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => {
                if (!confirmValues) return;
                const values = confirmValues;
                setConfirmValues(null);
                void saveCourseValues(values);
              }}
            >
              {isSaving ? "Đang gửi..." : changeRequestCopy.action}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                            <span
                              key={category}
                              className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-xs text-foreground"
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
                            </span>
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
                          onChange={(event) => {
                            setCategoryInput(event.target.value);
                            setShowAllCategorySuggestions(false);
                          }}
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
                      {categorySuggestionItems.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {categorySuggestionItems.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() =>
                                addCategory(
                                  category.name,
                                  field.value ?? [],
                                  field.onChange,
                                )
                              }
                              className="rounded-full border border-border/70 bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              {category.name}
                            </button>
                          ))}
                          {hiddenCategorySuggestionCount > 0 ? (
                            <button
                              type="button"
                              onClick={() => setShowAllCategorySuggestions(true)}
                              className="rounded-full border border-dashed border-border/80 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              Xem thêm
                            </button>
                          ) : null}
                          {showAllCategorySuggestions &&
                          categorySuggestionItems.length >
                            CATEGORY_SUGGESTION_LIMIT ? (
                            <button
                              type="button"
                              onClick={() => setShowAllCategorySuggestions(false)}
                              className="rounded-full border border-border/70 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                            >
                              Thu gọn
                            </button>
                          ) : null}
                        </div>
                      )}
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
        <div className="space-y-4 lg:sticky lg:top-24 lg:col-span-4 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          {/* Card 3: Giá bán */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-5">
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
                <Controller
                  name="price"
                  control={control}
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        ref={field.ref}
                        inputMode="numeric"
                        value={formatVndInput(field.value)}
                        onChange={(event) => field.onChange(parseVndInput(event.target.value))}
                        onBlur={field.onBlur}
                        onFocus={(event) => event.currentTarget.select()}
                        placeholder="Nhập giá bán, ví dụ 1.000.000"
                        className={cn("h-11 pr-10", errors.price && "border-destructive focus-visible:ring-destructive")}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                        đ
                      </span>
                    </div>
                  )}
                />
                {errors.price && (
                  <p className="text-xs text-destructive mt-0.5">{errors.price.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Ảnh đại diện (Thumbnail) */}
          <Card className="border-border/60 shadow-sm">
            <CardContent className="space-y-4 p-5">
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
                    <div className="relative h-40 w-full overflow-hidden rounded-lg border border-border bg-muted/20 shadow-xs xl:h-44">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnailUrlValue}
                        alt="Ảnh đại diện khóa học"
                        className="h-full w-full object-contain"
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
                        onClick={() => {
                          setValue("thumbnailUrl", "");
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
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
                      "flex h-40 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-5 text-center text-muted-foreground transition-colors hover:bg-muted/40 xl:h-44",
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
