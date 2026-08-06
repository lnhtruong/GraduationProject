import { z } from "zod";

export const lecturerRequestSchema = z.object({
  teachingTopics: z
    .string()
    .trim()
    .min(2, "Vui lòng nhập lĩnh vực muốn giảng dạy")
    .max(255, "Tối đa 255 ký tự"),
  confirm: z.string().max(5000, "Tối đa 5000 ký tự").optional(),
  evidenceImageIds: z
    .array(z.number())
    .min(1, "Vui lòng tải lên ít nhất một ảnh chứng minh năng lực")
    .max(5, "Tối đa 5 ảnh"),
});

export type LecturerRequestFormData = z.infer<typeof lecturerRequestSchema>;
