import { z } from "zod";

export const courseFormSchema = z.object({
  name: z.string().trim().min(1, "Tên khóa học không được để trống"),
  description: z.string().trim().min(1, "Mô tả khóa học không được để trống"),
  thumbnailUrl: z.string().nullable().optional(),
  categories: z.array(z.string()).min(1, "Vui lòng thêm ít nhất một danh mục"),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  duration: z.string().trim(),
  language: z.string().trim().min(1, "Ngôn ngữ không được để trống"),
  price: z.number().min(0, "Giá khóa học không được âm"),
  status: z.enum(["draft", "pending", "approved", "rejected", "publish", "banned"]).optional(),
});

export const lessonFormSchema = z.object({
  courseId: z.number(),
  title: z.string().trim().min(1, "Tên bài học không được để trống"),
  description: z.string().trim().min(1, "Mô tả bài học không được để trống"),
  contentType: z.enum(["video", "text"]),
  duration: z.number().min(0, "Thời lượng không được âm").optional(),
  content: z.record(z.string(), z.unknown()),
  status: z.enum(["active", "removed", "blocked"]).optional(),
  videoId: z.number().nullable().optional().refine((val) => val !== null && val !== undefined && val > 0, {
    message: "Vui lòng chọn hoặc tải lên một video",
  }),
});
