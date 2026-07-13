import { z } from "zod";

export const highlightParamsSchema = z.object({
  topic: z
    .string()
    .min(3, "Vui lòng nhập nội dung video rõ hơn một chút")
    .max(200, "Nội dung mô tả không được quá 200 ký tự"),
  includeKeywords: z.array(z.string()),
  excludeKeywords: z.array(z.string()),
  isMultiOutput: z.boolean(),
});

export type HighlightParamsFormValues = z.infer<typeof highlightParamsSchema>;
