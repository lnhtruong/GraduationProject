"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
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
import { RichTextBoxTiptap } from "@/components/RichTextBoxTiptap";
import { RichTextBoxCKE } from "@/components/RichTextBoxCKE";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { CourseFormValues, InstructorCourse } from "../types";
import { formatMonthYear } from "@/features/courses/utils";

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
  const [editorMode, setEditorMode] = useState<"tiptap" | "ckeditor">(
    "tiptap",
  );
  const [filledAt, setFilledAt] = useState<string | null>(null);
  const formOpenedAt = useMemo(() => new Date().toISOString(), []);

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
      categories: course?.categories ?? [],
      level: course?.level ?? "Beginner",
      duration: course?.duration ?? DEFAULT_DURATION,
      language: normalizeLanguageValue(course?.language),
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
      setFilledAt(new Date().toISOString());
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-medium">Mô tả</label>
                <div className="inline-flex items-center rounded-lg border border-border/70 bg-muted/40 p-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={editorMode === "tiptap" ? "default" : "ghost"}
                    className="h-7 px-3 text-xs"
                    onClick={() => setEditorMode("tiptap")}
                  >
                    Tiptap
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={editorMode === "ckeditor" ? "default" : "ghost"}
                    className="h-7 px-3 text-xs"
                    onClick={() => setEditorMode("ckeditor")}
                  >
                    CKEditor
                  </Button>
                </div>
              </div>
              <Controller
                name="description"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  editorMode === "tiptap" ? (
                    <RichTextBoxTiptap
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Mô tả khóa học, bạn có thể copy paste từ các nền tảng khác..."
                    />
                  ) : (
                    <RichTextBoxCKE
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Mô tả khóa học, bạn có thể copy paste từ các nền tảng khác..."
                    />
                  )
                )}
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
                            {getLevelLabel(level)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Ngôn ngữ</label>
                <Controller
                  name="language"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-11 w-full">
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
              </div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Danh mục</label>
                <Controller
                  name="categories"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2 rounded-lg border border-input bg-background p-2.5">
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
        <Card className="overflow-hidden border-border/70 bg-card text-card-foreground shadow-sm">
          <CardContent className="space-y-4 p-5">
            <div className="rounded-xl bg-linear-to-br from-primary/20 via-primary/5 to-transparent p-4">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Live Preview
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="line-clamp-2 text-lg font-semibold text-foreground">
                {nameValue || "Khóa học mới"}
              </h3>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <div
                  className="course-preview-html text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: previewDescriptionHtml }}
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
          </CardContent>
        </Card>

        <Button type="submit" className="w-full">
          {isEdit ? "Lưu thay đổi" : "Tạo khóa học"}
        </Button>

        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 text-xs text-muted-foreground">
          Sau khi tạo khóa học, bạn có thể thêm lesson và quiz ở các trang quản
          lý chi tiết. Thời lượng và trạng thái sẽ được hệ thống xử lý mặc định.
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
      </div>
    </form>
  );
}
