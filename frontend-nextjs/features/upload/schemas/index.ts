import { z } from "zod";

/**
 * Upload Feature Schemas
 * Zod validation schemas for upload forms
 */

export const highlightParamsSchema = z.object({
  topic: z
    .string()
    .min(3, "Chủ đề phải có ít nhất 3 ký tự")
    .max(200, "Chủ đề không được quá 200 ký tự"),
  includeKeywords: z
    .array(z.string())
    .min(1, "Vui lòng chọn ít nhất 1 từ khóa cần giữ lại"),
  excludeKeywords: z.array(z.string()),
});

export type HighlightParamsFormValues = z.infer<typeof highlightParamsSchema>;
