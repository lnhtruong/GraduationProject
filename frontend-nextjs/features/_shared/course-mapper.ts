import type { CourseCardData } from "./course-card.types";

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Raw shape BE trả về từ GET /course/courses và GET /course/courses/:id */
export type CourseRaw = {
  id: number;
  name: string;
  description?: string;
  categories: { id: number; name: string }[] | string | unknown;
  level?: string | null;
  duration?: string | null;
  language?: string | null;
  price: number;
  userId: number;
  status: string;
  thumbnailUrl?: string | null;
  // Có sau khi backend bổ sung (xem README ## API Requirements):
  instructor?: {
    id?: number;
    first_name?: string | null;
    last_name?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    avatar_url?: string | null;
    avatarUrl?: string | null;
  } | null;
  avg_rating?: number | null;
  review_count?: number | null;
  enrolled_count?: number | null;
};

export type CoursesRawResponse =
  | { data: CourseRaw[]; pagination?: unknown }
  | CourseRaw[];

export function mapCourseRaw(raw: CourseRaw): CourseCardData {
  const cats = Array.isArray(raw.categories)
    ? (raw.categories as { name: string }[])
    : [];

  const thumbnail = raw.thumbnailUrl ?? null;

  const inst = raw.instructor;
  const instructorName = inst
    ? `${inst.first_name ?? inst.firstName ?? ""} ${inst.last_name ?? inst.lastName ?? ""}`.trim() ||
      null
    : null;
  const instructorAvatar = inst?.avatar_url ?? inst?.avatarUrl ?? null;

  return {
    id: raw.id,
    title: raw.name,
    instructorName,
    instructorAvatar,
    avgRating: parseNullableNumber(raw.avg_rating),
    reviewCount: parseNullableNumber(raw.review_count),
    enrolledCount: parseNullableNumber(raw.enrolled_count),
    price: raw.price === 0 ? null : raw.price,
    category: cats[0]?.name ?? null,
    thumbnailUrl: thumbnail,
    level: raw.level ?? null,
  };
}

export function extractCourses(data: CoursesRawResponse): CourseRaw[] {
  return Array.isArray(data) ? data : data.data;
}
