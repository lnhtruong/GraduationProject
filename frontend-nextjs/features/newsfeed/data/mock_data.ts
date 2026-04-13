const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;
const COURSE_CATEGORIES = [
  ["Frontend", "React"],
  ["Backend", "NodeJS"],
  ["Data", "SQL"],
  ["Mobile", "Flutter"],
  ["AI", "Prompting"],
] as const;
const COURSE_STATUSES = ["draft", "published"] as const;

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
      "Tom tat noi dung bai giang theo phong cach ngan gon de hoc vien xem nhanh tren newsfeed. Ban demo newsfeed dang su dung mock data theo format API khoa hoc. Thong tin chi tiet se duoc hien thi khi click vao tung bai hoc.",
  };
}

export function buildMockCourseInfo(
  index: number,
  displayIndex: number,
  userId?: number | null,
) {
  const status = COURSE_STATUSES[index % COURSE_STATUSES.length];
  const categories = COURSE_CATEGORIES[index % COURSE_CATEGORIES.length];

  return {
    name: `React cho nguoi moi bat dau #${displayIndex}`,
    level: COURSE_LEVELS[index % COURSE_LEVELS.length],
    duration: `${10 + (displayIndex % 8)}:${String(20 + (displayIndex % 30)).padStart(2, "0")}:00`,
    language: "vi",
    price: 299000 + (displayIndex % 5) * 100000,
    userId: userId ?? 1,
    status,
    categories: [...categories],
    description:
      "Khoa hoc tu co ban den du an nho. Ban demo newsfeed dang su dung mock data theo format API khoa hoc.",
    created_at: new Date(Date.now() - displayIndex * 86400000).toISOString(),
    updated_at: new Date(Date.now() - displayIndex * 3600000).toISOString(),
  };
}
