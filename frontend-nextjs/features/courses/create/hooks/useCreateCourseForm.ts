import * as React from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useCreateCourse } from "../../api/course.hooks";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import type { CreateCourseFormValues } from "../types";
import { getApiErrorMessage, normalizeCategoryKeyword, toCreateCoursePayload } from "../utils/course-create.utils";

function getPlainTextFromHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const createCourseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Tên khóa học cần tối thiểu 3 ký tự.")
    .max(255, "Tên khóa học tối đa 255 ký tự."),
  description: z
    .string()
    .min(1, "Vui lòng nhập mô tả khóa học.")
    .max(10000, "Nội dung mô tả quá dài.")
    .refine((html) => getPlainTextFromHtml(html).length >= 20, {
      message: "Mô tả cần tối thiểu 20 ký tự nội dung.",
    }),
  categories: z
    .array(z.string().trim().min(1))
    .min(1, "Vui lòng thêm ít nhất 1 danh mục.")
    .max(10, "Tối đa 10 danh mục."),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  durationHours: z
    .number()
    .int("Giờ học phải là số nguyên.")
    .min(0, "Giờ học không hợp lệ.")
    .max(23, "Giờ học tối đa là 23."),
  durationMinutes: z
    .number()
    .int("Phút học phải là số nguyên.")
    .min(0, "Phút học không hợp lệ.")
    .max(59, "Phút học tối đa là 59."),
  language: z
    .string()
    .trim()
    .min(1, "Vui lòng chọn ngôn ngữ.")
    .max(255, "Ngôn ngữ tối đa 255 ký tự."),
  price: z
    .number()
    .min(0, "Giá khóa học không được âm.")
    .max(1000000000, "Giá khóa học vượt quá giới hạn cho phép."),
  status: z.enum(["draft", "pending", "approved", "rejected", "publish"]),
});

export function useCreateCourseForm() {
  const router = useRouter();
  const { user } = useAuthState();

  const [categoryDraft, setCategoryDraft] = React.useState("");

  const form = useForm<CreateCourseFormValues>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      name: "",
      description: "",
      categories: ["AI", "Machine Learning"],
      level: "Beginner",
      durationHours: 2,
      durationMinutes: 0,
      language: "Vietnamese",
      price: 0,
      status: "draft",
    },
    mode: "onChange",
  });

  const createCourseMutation = useCreateCourse();

  const addCategory = React.useCallback(() => {
    const normalized = normalizeCategoryKeyword(categoryDraft);
    if (!normalized) return;

    const current = form.getValues("categories");
    if (current.includes(normalized)) {
      setCategoryDraft("");
      return;
    }

    const next = [...current, normalized];
    form.setValue("categories", next, { shouldValidate: true });
    setCategoryDraft("");
  }, [categoryDraft, form]);

  const removeCategory = React.useCallback(
    (category: string) => {
      const next = form
        .getValues("categories")
        .filter((item) => item !== category);
      form.setValue("categories", next, { shouldValidate: true });
    },
    [form],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user?.id) {
      toast.error("Bạn cần đăng nhập để tạo khóa học.");
      return;
    }

    try {
      const payload = toCreateCoursePayload(values, user.id);
      const created = await createCourseMutation.mutateAsync(payload);

      toast.success("Tạo khóa học thành công.");
      router.push(`/courses/${created.id}`);
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    }
  });

  return {
    form,
    categoryDraft,
    setCategoryDraft,
    addCategory,
    removeCategory,
    onSubmit,
    isSubmitting: createCourseMutation.isPending,
  };
}
