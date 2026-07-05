import { z } from "zod";

export const lecturerRequestSchema = z.object({
  confirm: z.string().max(5000, "Tối đa 5000 ký tự").optional(),
});

export type LecturerRequestFormData = z.infer<typeof lecturerRequestSchema>;
