import { useQuery } from "@tanstack/react-query";
import { apiHttpClient } from "@/features/_shared/api-factories";
import { parseHHMMSS } from "../utils";
import type {
  CourseDetail,
  CourseInstructor,
  Lesson,
  LessonContentType,
  RatingSummary,
  FeedbackListResponse,
} from "../types";

// ---------------------------------------------------------------------------
// Raw backend shapes
// ---------------------------------------------------------------------------

interface RawVideo {
  id?: number;
  url?: string | null;
  thumbnail?: string | null;
  bunny_video_guid?: string | null;
  duration?: number | null;
}

interface RawCourse {
  id?: number;
  name?: string;
  description?: string;
  categories?: string[];
  level?: string;
  duration?: string;
  language?: string;
  price?: number;
  userId?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  thumbnailUrl?: string | null;
  video?: RawVideo | null;
  lessons?: RawLesson[];
}

interface RawLesson {
  id?: number;
  title?: string;
  contentType?: string;
  duration?: string | null;
  status?: string;
}

interface RawUser {
  id?: number;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapLesson(raw: RawLesson, index: number): Lesson {
  const contentType = (raw.contentType ?? "video") as LessonContentType;
  return {
    id: raw.id ?? 0,
    title: raw.title ?? "",
    contentType: ["video", "text", "quiz", "assignment"].includes(contentType)
      ? contentType
      : "video",
    duration: parseHHMMSS(raw.duration),
    order: index + 1,
    isFree: false,
  };
}

function mapInstructor(raw: RawUser): CourseInstructor {
  return {
    id: raw.id ?? 0,
    firstName: raw.firstName ?? "",
    lastName: raw.lastName ?? "",
    avatarUrl: raw.avatarUrl ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchRawCourse(id: number): Promise<RawCourse> {
  const { data } = await apiHttpClient.get<RawCourse>(`/course/courses/${id}`);
  return data;
}

async function fetchInstructor(userId: number): Promise<CourseInstructor> {
  try {
    const { data } = await apiHttpClient.get<RawUser>(`/course/users/${userId}`);
    return mapInstructor(data);
  } catch {
    return { id: userId, firstName: "Giảng viên", lastName: "" };
  }
}

async function fetchFeedbackSummary(courseId: number): Promise<RatingSummary> {
  try {
    const { data } = await apiHttpClient.get<FeedbackListResponse>(
      `/course/feedbacks/${courseId}?page=1&limit=1`,
    );
    const s = data.summary;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    for (const d of s.distribution ?? []) {
      const k = d.rating as 1 | 2 | 3 | 4 | 5;
      if (k >= 1 && k <= 5) breakdown[k] = d.count;
    }
    return { average: s.averageRating ?? 0, total: s.totalReviews ?? 0, breakdown };
  } catch {
    return { average: 0, total: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };
  }
}

// ---------------------------------------------------------------------------
// Assemble CourseDetail
// ---------------------------------------------------------------------------

async function fetchCourseDetail(courseId: number): Promise<CourseDetail> {
  const raw = await fetchRawCourse(courseId);

  const [instructor, ratingSummary] = await Promise.all([
    raw.userId ? fetchInstructor(raw.userId) : Promise.resolve<CourseInstructor>({
      id: 0,
      firstName: "Giảng viên",
      lastName: "",
    }),
    fetchFeedbackSummary(courseId),
  ]);

  const lessons: Lesson[] = (raw.lessons ?? []).map(mapLesson);

  const description = raw.description ?? "";
  const shortDescription =
    description.length <= 300
      ? description
      : description.slice(0, 300).replace(/\s+\S*$/, "") + "…";
  const categories = (raw.categories ?? []).map((name, i) => ({ id: i, name }));

  // Prefer summing lesson durations; fall back to course-level duration field
  const lessonsDuration = lessons.reduce((acc: number, l: Lesson) => acc + l.duration, 0);
  const duration = lessonsDuration > 0 ? lessonsDuration : parseHHMMSS(raw.duration);

  const video = raw.video ?? null;

  return {
    id: raw.id ?? courseId,
    name: raw.name ?? "",
    shortDescription,
    description,
    thumbnailUrl: raw.thumbnailUrl ?? undefined,
    previewVideoUrl: video?.url ?? undefined,
    highlightClipUrl: undefined,
    categories,
    level: (raw.level as CourseDetail["level"]) ?? "Beginner",
    duration,
    language: raw.language ?? "vi",
    price: raw.price ?? 0,
    hasCertificate: false,
    instructor,
    lessons,
    ratingSummary,
    reviews: [],
    totalLessons: lessons.length,
    totalStudents: 0,
    lastUpdatedAt: raw.updated_at ?? raw.created_at ?? new Date().toISOString(),
    createdAt: raw.created_at ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCourseDetail(courseId: number) {
  return useQuery({
    queryKey: ["courseDetail", courseId],
    queryFn: () => fetchCourseDetail(courseId),
    enabled: courseId > 0,
    staleTime: 5 * 60_000,
  });
}
