import type { CreateCourseRequest } from "../../types";
import type { CreateCourseFormValues } from "../types";

export function normalizeCategoryKeyword(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function normalizeCategories(categories: string[]): string[] {
  const set = new Set<string>();

  for (const category of categories) {
    const normalized = normalizeCategoryKeyword(category);
    if (normalized) {
      set.add(normalized);
    }
  }

  return [...set];
}

export function toCourseDuration(hours: number, minutes: number): string {
  const safeHours = Number.isFinite(hours)
    ? Math.max(0, Math.min(23, Math.floor(hours)))
    : 0;
  const safeMinutes = Number.isFinite(minutes)
    ? Math.max(0, Math.min(59, Math.floor(minutes)))
    : 0;

  return `${String(safeHours).padStart(2, "0")}:${String(safeMinutes).padStart(2, "0")}:00`;
}

export function toCreateCoursePayload(
  values: CreateCourseFormValues,
  userId: number,
): CreateCourseRequest {
  return {
    name: values.name.trim(),
    description: values.description.trim() || undefined,
    categories: normalizeCategories(values.categories),
    level: values.level,
    duration: toCourseDuration(values.durationHours, values.durationMinutes),
    language: values.language.trim(),
    price: values.price,
    userId,
    status: values.status,
  };
}

export function getApiErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = (error.response as { data?: { message?: unknown } }).data;
    const message = data?.message;

    if (Array.isArray(message) && message.length > 0) {
      return String(message[0]);
    }

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Không thể tạo khóa học. Vui lòng thử lại.";
}
