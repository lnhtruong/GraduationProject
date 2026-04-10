const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const COURSE_CATEGORIES = [
  "AI in Education",
  "Data Storytelling",
  "Learning Design",
  "Productivity",
  "Digital Skills",
] as const;

export function buildMockStats(seed: number) {
  return {
    likes: 100 + ((seed * 37) % 2000),
    comments: 10 + ((seed * 17) % 240),
    saves: 6 + ((seed * 11) % 200),
    shares: 4 + ((seed * 13) % 120),
  };
}

export function buildMockFeedInfo(displayIndex: number) {
  return {
    title: `Bai hoc ngan #${displayIndex}`,
    description:
      "Tom tat noi dung bai giang theo phong cach ngan gon de hoc vien xem nhanh tren newsfeed.",
  };
}

export function buildMockCourseInfo(index: number, displayIndex: number) {
  return {
    title: `Khoa hoc demo ${displayIndex}`,
    instructor: `Giang vien ${displayIndex}`,
    category: COURSE_CATEGORIES[index % COURSE_CATEGORIES.length],
    level: COURSE_LEVELS[index % COURSE_LEVELS.length],
    durationLabel: `${12 + (displayIndex % 8)} gio`,
    totalLessons: 8 + (displayIndex % 20),
    description:
      "Mo ta demo cho thong tin khoa hoc. Sau nay co the thay bang API chi tiet khoa hoc.",
    tags: ["video ngan", "hoc nhanh", "thuc hanh"],
    students: 200 + displayIndex * 13,
    rating: Number((4 + (displayIndex % 9) / 10).toFixed(1)),
  };
}
