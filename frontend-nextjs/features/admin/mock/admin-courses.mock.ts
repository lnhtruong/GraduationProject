import type { Course } from "@/features/courses/types";
import type { Lesson } from "@/features/lessons/types";
import type { InstructorUser } from "../api/admin-courses.api";

export const USE_MOCK = process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_MOCK_ADMIN_REVIEW === "true";

export const MOCK_ADMIN_COURSES: Course[] = [
  // ── HAPPY PATH ────────────────────────────────────────────────────────────
  // Course 1: Tất cả video đều có URL hợp lệ, > 10 lessons (test pagination)
  {
    id: 1,
    name: "React từ cơ bản đến nâng cao",
    description: "Khóa học React toàn diện từ cơ bản đến nâng cao, bao gồm hooks, context, và các pattern hiện đại.",
    categories: ["Web Development", "Frontend", "JavaScript"],
    level: "Beginner",
    duration: "12:30:00",
    language: "vi",
    price: 499000,
    userId: 10,
    status: "pending",
    created_at: "2026-04-10T08:00:00.000Z",
    updated_at: "2026-04-15T09:00:00.000Z",
  },

  // ── MIXED VIDEO URL ────────────────────────────────────────────────────────
  // Course 2: Một số bài có URL, một số không → warning badge + footer warning
  {
    id: 2,
    name: "Python cho Data Science",
    description: "Học Python ứng dụng trong khoa học dữ liệu, pandas, numpy và machine learning cơ bản.",
    categories: ["Data Science", "Python", "Machine Learning"],
    level: "Intermediate",
    duration: "20:00:00",
    language: "vi",
    price: 799000,
    userId: 11,
    status: "pending",
    created_at: "2026-04-12T10:00:00.000Z",
    updated_at: "2026-04-16T11:00:00.000Z",
  },

  // ── UNSAFE VIDEO URLS ─────────────────────────────────────────────────────
  // Course 3: blob:, data:, relative path → "URL không hợp lệ"
  {
    id: 3,
    name: "Node.js & Express REST API",
    description: "Xây dựng REST API chuyên nghiệp với Node.js, Express, JWT authentication và MongoDB.",
    categories: ["Backend", "Node.js", "API"],
    level: "Intermediate",
    duration: "15:45:00",
    language: "vi",
    price: 649000,
    userId: 12,
    status: "pending",
    created_at: "2026-04-13T07:30:00.000Z",
    updated_at: "2026-04-17T08:00:00.000Z",
  },

  // ── EDGE CASES: COURSE METADATA ───────────────────────────────────────────
  // Course 4: level không xác định, categories rỗng, ngôn ngữ lạ, giá = 0
  {
    id: 4,
    name: "AWS Cloud Practitioner Bootcamp",
    description: "",
    categories: [],
    level: "Unknown" as never,
    duration: "10:20:00",
    language: "jp",
    price: 0,
    userId: 13,
    status: "pending",
    created_at: "invalid-date-string",
    updated_at: "2026-04-14T10:00:00.000Z",
  },

  // Course 5: Tên rỗng, price âm (dữ liệu lỗi từ BE)
  {
    id: 5,
    name: "",
    description: "Khóa học với metadata bị thiếu.",
    categories: ["DevOps"],
    level: "Advanced",
    duration: "00:00:00",
    language: "vi",
    price: -100,
    userId: 14,
    status: "pending",
    created_at: "2026-04-08T11:00:00.000Z",
    updated_at: "2026-04-13T12:00:00.000Z",
  },

  // ── INSTRUCTOR EDGE CASES ─────────────────────────────────────────────────
  // Course 6: userId = 0 → InstructorInfo hiện "ID không hợp lệ"
  {
    id: 6,
    name: "UI/UX Design với Figma",
    description: "Thiết kế giao diện người dùng chuyên nghiệp với Figma.",
    categories: ["Design", "UI/UX"],
    level: "Beginner",
    duration: "8:30:00",
    language: "vi",
    price: 399000,
    userId: 0,
    status: "pending",
    created_at: "2026-04-17T08:00:00.000Z",
    updated_at: "2026-04-20T09:00:00.000Z",
  },

  // Course 7: userId hợp lệ nhưng không có trong MOCK_USERS → isError path
  {
    id: 7,
    name: "TypeScript Advanced Patterns",
    description: "Khai thác sức mạnh của TypeScript với generics nâng cao.",
    categories: ["TypeScript", "Frontend"],
    level: "Advanced",
    duration: "9:15:00",
    language: "en",
    price: 549000,
    userId: 999,
    status: "pending",
    created_at: "2026-04-18T14:00:00.000Z",
    updated_at: "2026-04-20T15:00:00.000Z",
  },

  // ── LESSON EDGE CASES ─────────────────────────────────────────────────────
  // Course 8: Tất cả video thiếu URL → toàn bộ amber + footer warning
  {
    id: 8,
    name: "SQL & PostgreSQL cho Developer",
    description: "Nắm vững SQL từ cơ bản đến nâng cao với PostgreSQL.",
    categories: ["Database", "SQL"],
    level: "Beginner",
    duration: "11:00:00",
    language: "vi",
    price: 449000,
    userId: 17,
    status: "pending",
    created_at: "2026-03-25T10:00:00.000Z",
    updated_at: "2026-04-01T11:00:00.000Z",
  },

  // Course 9: Không có lesson nào → "Chưa có bài học"
  {
    id: 9,
    name: "Khóa học chưa có nội dung",
    description: "Instructor đã tạo khóa học nhưng chưa thêm bất kỳ bài học nào.",
    categories: ["Misc"],
    level: "Beginner",
    duration: undefined,
    language: "vi",
    price: 199000,
    userId: 10,
    status: "pending",
    created_at: "2026-04-20T08:00:00.000Z",
    updated_at: "2026-04-20T08:00:00.000Z",
  },

  // Course 10: Chỉ có text lesson (không có video) → không hiện URL row
  {
    id: 10,
    name: "Khóa học chỉ có tài liệu đọc",
    description: "Tất cả bài học là text, không có video.",
    categories: ["Reading"],
    level: "Beginner",
    duration: "3:00:00",
    language: "vi",
    price: 99000,
    userId: 11,
    status: "pending",
    created_at: "2026-04-21T10:00:00.000Z",
    updated_at: "2026-04-21T10:00:00.000Z",
  },

  // ── NON-PENDING STATUSES ──────────────────────────────────────────────────
  {
    id: 11,
    name: "Docker & Kubernetes Mastery",
    description: "Làm chủ container hóa với Docker và Kubernetes.",
    categories: ["DevOps", "Docker"],
    level: "Advanced",
    duration: "18:00:00",
    language: "vi",
    price: 1099000,
    userId: 14,
    status: "rejected",
    created_at: "2026-04-08T11:00:00.000Z",
    updated_at: "2026-04-13T12:00:00.000Z",
  },
  {
    id: 12,
    name: "Git & GitHub Mastery",
    description: "Làm chủ Git và GitHub cho team workflow.",
    categories: ["DevOps", "Git"],
    level: "Beginner",
    duration: "6:00:00",
    language: "vi",
    price: 299000,
    userId: 15,
    status: "approved",
    created_at: "2026-04-01T10:00:00.000Z",
    updated_at: "2026-04-10T11:00:00.000Z",
  },
];

export const MOCK_PENDING_COURSES = MOCK_ADMIN_COURSES.filter(
  (c) => c.status === "pending",
);

// ── Users ──────────────────────────────────────────────────────────────────
// userId 999 không có trong map → simulate isError trong InstructorInfo
export const MOCK_USERS: Record<number, InstructorUser> = {
  10: { id: 10, email: "nguyen.van.a@gmail.com",  firstName: "Nguyễn", lastName: "Văn A",  role: 3, avatarUrl: "https://picsum.photos/seed/user10/64/64" },
  11: { id: 11, email: "tran.thi.b@gmail.com",    firstName: "Trần",   lastName: "Thị B",  role: 3, avatarUrl: null },
  12: { id: 12, email: "le.van.c@gmail.com",       firstName: "Lê",     lastName: "Văn C",  role: 3 },
  13: { id: 13, email: "pham.thi.d@gmail.com",    firstName: null,     lastName: null,      role: 3 },  // tên null → fallback email
  14: { id: 14, email: "hoang.van.e@gmail.com",   firstName: "Hoàng",  lastName: "Văn E",  role: 3 },
  15: { id: 15, email: "do.thi.f@gmail.com",       firstName: "Đỗ",     lastName: "Thị F",  role: 3 },
  17: { id: 17, email: "vu.thi.h@gmail.com",       firstName: "Vũ",     lastName: "Thị H",  role: 3 },
  // 999: intentionally missing → triggers isError in useInstructorUser mock
};

// ── Lessons ────────────────────────────────────────────────────────────────
export const MOCK_LESSONS_BY_COURSE: Record<number, Lesson[]> = {

  // Course 1 — Happy path: 11 lessons (> PAGE_SIZE=10 → test pagination)
  // All video lessons have valid https URLs
  1: [
    { id: 101, courseId: 1, title: "Giới thiệu React & môi trường",         contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/react-intro.mp4" },     duration: 900,  status: "active" },
    { id: 102, courseId: 1, title: "JSX và các khái niệm cơ bản",           contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/react-jsx.mp4" },       duration: 1320, status: "active" },
    { id: 103, courseId: 1, title: "State và Props",                          contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/react-state.mp4" },     duration: 1800, status: "active" },
    { id: 104, courseId: 1, title: "useState & useEffect",                    contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/react-hooks.mp4" },     duration: 2100, status: "active" },
    { id: 105, courseId: 1, title: "Context API",                             contentType: "text",  content: { summary: "Tổng quan về Context API và cách tránh prop drilling." },            duration: 1200, status: "active" },
    { id: 106, courseId: 1, title: "React Router",                            contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/react-router.mp4" },    duration: 1500, status: "active" },
    { id: 107, courseId: 1, title: "Custom Hooks",                            contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/react-custom.mp4" },    duration: 1680, status: "active" },
    { id: 108, courseId: 1, title: "Tối ưu hiệu suất với useMemo",           contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/react-perf.mp4" },      duration: 1920, status: "active" },
    { id: 109, courseId: 1, title: "Testing với React Testing Library",       contentType: "text",  content: { summary: "Hướng dẫn viết unit test cho React components." },                   duration: 1080, status: "active" },
    { id: 110, courseId: 1, title: "Dự án thực tế: Todo App",                 contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/react-todo.mp4" },      duration: 2700, status: "active" },
    { id: 111, courseId: 1, title: "Deploy lên Vercel",                       contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/react-deploy.mp4" },    duration: 900,  status: "active" },
  ],

  // Course 2 — Mixed: 4 video có URL, 3 video thiếu URL, 1 text
  2: [
    { id: 201, courseId: 2, title: "Python cơ bản & cài đặt",                contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/python-intro.mp4" },    duration: 1200, status: "active" },
    { id: 202, courseId: 2, title: "NumPy arrays & operations",               contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/numpy.mp4" },           duration: 2100, status: "active" },
    { id: 203, courseId: 2, title: "Pandas DataFrame",                        contentType: "video", content: {},                                                                               duration: 2400, status: "active" },
    { id: 204, courseId: 2, title: "Data cleaning & preprocessing",           contentType: "video", content: { url: "" },                                                                     duration: 2280, status: "active" },  // url là empty string
    { id: 205, courseId: 2, title: "Matplotlib & Seaborn",                    contentType: "video", content: { url: "   " },                                                                  duration: 1800, status: "active" },  // url chỉ toàn whitespace
    { id: 206, courseId: 2, title: "Machine Learning cơ bản",                 contentType: "text",  content: { summary: "Giới thiệu các thuật toán ML phổ biến." },                          duration: 1500, status: "active" },
    { id: 207, courseId: 2, title: "Scikit-learn thực hành",                  contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/sklearn.mp4" },         duration: 2700, status: "active" },
    { id: 208, courseId: 2, title: "Dự án phân tích dữ liệu",                 contentType: "video", content: {},                                                                               duration: 3600, status: "active" },
  ],

  // Course 3 — Unsafe URLs: blob, data, relative path
  3: [
    { id: 301, courseId: 3, title: "Node.js & npm cơ bản",                   contentType: "video", content: { url: "blob:http://localhost:3000/abc-123-def" },                              duration: 1080, status: "active" },  // blob URL
    { id: 302, courseId: 3, title: "Express.js setup",                        contentType: "video", content: { url: "data:video/mp4;base64,AAAAHGZ0eXBtcDQy" },                             duration: 1500, status: "active" },  // data URL
    { id: 303, courseId: 3, title: "REST API design patterns",                contentType: "text",  content: { summary: "Thiết kế RESTful API chuẩn." },                                     duration: 1200, status: "active" },
    { id: 304, courseId: 3, title: "Middleware & routing",                    contentType: "video", content: { url: "/videos/middleware-lesson.mp4" },                                       duration: 1800, status: "active" },  // relative path
    { id: 305, courseId: 3, title: "JWT Authentication",                      contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/jwt.mp4" },            duration: 2100, status: "active" },  // valid → hiện link
    { id: 306, courseId: 3, title: "MongoDB & Mongoose",                      contentType: "video", content: { url: "ftp://files.example.com/mongo.mp4" },                                  duration: 2400, status: "active" },  // ftp → unsafe
  ],

  // Course 4 — Metadata lỗi, content type không xác định
  4: [
    { id: 401, courseId: 4, title: "Module 1",                                contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/aws-1.mp4" },          duration: 1800, status: "active" },
    { id: 402, courseId: 4, title: "",                                         contentType: "video", content: {},                                                                               duration: 0,    status: "active" },  // tiêu đề rỗng + duration = 0
    { id: 403, courseId: 4, title: "Hands-on Lab",                            contentType: "quiz" as never,  content: {},                                                                     duration: 600,  status: "active" },  // contentType không xác định
  ],

  // Course 5 — Metadata lỗi
  5: [
    { id: 501, courseId: 5, title: "Bài 1",                                   contentType: "video", content: {},                                                                               duration: 1200, status: "active" },
    { id: 502, courseId: 5, title: "Bài 2",                                   contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/k8s-2.mp4" },          duration: 1500, status: "active" },
  ],

  // Course 6 — userId = 0, test InstructorInfo "invalid ID"
  6: [
    { id: 601, courseId: 6, title: "Giới thiệu Figma",                        contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/figma-1.mp4" },        duration: 900,  status: "active" },
    { id: 602, courseId: 6, title: "Auto Layout",                             contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/figma-2.mp4" },        duration: 1500, status: "active" },
  ],

  // Course 7 — userId 999 không trong MOCK_USERS → isError
  7: [
    { id: 701, courseId: 7, title: "TypeScript Generics nâng cao",            contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/ts-1.mp4" },           duration: 2400, status: "active" },
    { id: 702, courseId: 7, title: "Conditional Types",                       contentType: "video", content: { url: "https://res.cloudinary.com/demo/video/upload/v1/ts-2.mp4" },           duration: 2100, status: "active" },
  ],

  // Course 8 — Tất cả video đều thiếu URL (content: {})
  8: [
    { id: 801, courseId: 8, title: "SQL cơ bản",                              contentType: "video", content: {},                                                                               duration: 1500, status: "active" },
    { id: 802, courseId: 8, title: "SELECT nâng cao",                         contentType: "video", content: {},                                                                               duration: 1800, status: "active" },
    { id: 803, courseId: 8, title: "JOIN và subquery",                        contentType: "video", content: {},                                                                               duration: 2100, status: "active" },
    { id: 804, courseId: 8, title: "Index & Query optimization",              contentType: "text",  content: { summary: "Tối ưu hiệu suất database với index." },                            duration: 1200, status: "active" },
    { id: 805, courseId: 8, title: "Transaction & ACID",                      contentType: "video", content: {},                                                                               duration: 1680, status: "active" },
  ],

  // Course 9 — Không có lesson (mảng rỗng)
  9: [],

  // Course 10 — Chỉ text lesson, không video
  10: [
    { id: 1001, courseId: 10, title: "Chương 1: Lý thuyết cơ bản",           contentType: "text",  content: { summary: "Tổng quan về chủ đề." },                                           duration: 600,  status: "active" },
    { id: 1002, courseId: 10, title: "Chương 2: Thực hành",                   contentType: "text",  content: { summary: "Bài tập thực hành." },                                              duration: 900,  status: "active" },
    { id: 1003, courseId: 10, title: "Chương 3: Tổng kết",                    contentType: "text",  content: { summary: "Ôn tập và kết luận." },                                             duration: 480,  status: "active" },
  ],
};
