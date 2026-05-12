import type { CourseDetail, Enrollment, Review } from "./types";

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------
const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    userId: 101,
    rating: 5,
    comment:
      "Khóa học cực kỳ chi tiết và dễ hiểu. Giảng viên giải thích từng bước rõ ràng, ngay cả khi tôi chưa biết gì về lập trình. Sau khoá này tôi đã tự build được app nhỏ đầu tiên!",
    createdAt: "2026-03-15T08:30:00Z",
    user: { firstName: "Nguyễn Thị", lastName: "Hoa" },
  },
  {
    id: 2,
    userId: 102,
    rating: 5,
    comment:
      "Nội dung được cập nhật liên tục, bám sát thực tế. Phần dự án cuối khoá rất hay, áp dụng được ngay vào công việc. Highly recommend!",
    createdAt: "2026-03-10T14:20:00Z",
    user: { firstName: "Trần Văn", lastName: "Minh" },
  },
  {
    id: 3,
    userId: 103,
    rating: 4,
    comment:
      "Tổng thể rất tốt, chỉ có một vài bài video hơi dài. Mong giảng viên chia nhỏ hơn để dễ theo dõi. Nhưng kiến thức truyền đạt đầy đủ và chính xác.",
    createdAt: "2026-02-28T09:15:00Z",
    user: { firstName: "Lê Thị", lastName: "Thu" },
  },
  {
    id: 4,
    userId: 104,
    rating: 5,
    comment:
      "Phần OOP và xử lý lỗi được dạy rất bài bản. Tôi đã học nhiều khóa Python khác nhưng đây là khóa đầy đủ nhất tôi từng học.",
    createdAt: "2026-02-20T16:45:00Z",
    user: { firstName: "Phạm Hoàng", lastName: "Long" },
  },
  {
    id: 5,
    userId: 105,
    rating: 5,
    comment:
      "Quiz sau mỗi chương rất hữu ích để kiểm tra lại kiến thức. Giảng viên nhiệt tình trả lời câu hỏi trong forum. 5/5!",
    createdAt: "2026-02-10T11:00:00Z",
    user: { firstName: "Hoàng Thị", lastName: "Mai" },
  },
];

// ---------------------------------------------------------------------------
// Main mock course
// ---------------------------------------------------------------------------
export const MOCK_COURSE: CourseDetail = {
  id: 1,
  name: "Python cho người mới bắt đầu — Từ cơ bản đến thực chiến",
  shortDescription:
    "Nắm vững Python từ con số 0 với 42 bài học thực tế, dự án cuối khoá và chứng chỉ hoàn thành.",
  description: `Python là ngôn ngữ lập trình phổ biến nhất thế giới, được dùng trong web, AI, data science và automation. Khóa học này được thiết kế đặc biệt cho người chưa có kinh nghiệm lập trình, dẫn dắt bạn từng bước từ cài đặt môi trường đến xây dựng ứng dụng thực tế.

Bạn sẽ học qua các video ngắn gọn, bài tập thực hành sau mỗi chương, và một dự án cuối khoá hoàn chỉnh. Sau khi hoàn thành, bạn sẽ tự tin viết code Python sạch, đúng chuẩn và sẵn sàng cho công việc thực tế.

Khóa học cập nhật liên tục — mua một lần, học mãi mãi. Tham gia cộng đồng 12.000+ học viên đang học cùng bạn!`,

  thumbnailUrl: "/course-thumb-python.jpg",
  previewVideoUrl: undefined,
  highlightClipUrl: undefined,

  whatYouLearn: [
    "Nắm vững cú pháp và tư duy lập trình Python từ đầu",
    "Xây dựng ứng dụng web nhỏ với Flask",
    "Làm việc với dữ liệu bằng Pandas và NumPy",
    "Tự động hoá công việc lặp lại bằng script Python",
    "Hiểu và áp dụng lập trình hướng đối tượng (OOP)",
    "Xây dựng và deploy dự án thực tế lên server",
    "Viết code sạch theo chuẩn PEP 8",
    "Debug và test code với unittest & pytest",
  ],

  requirements: [
    "Máy tính có kết nối internet (Windows, Mac hoặc Linux đều được)",
    "Không cần kinh nghiệm lập trình trước — khoá học dành cho người mới hoàn toàn",
    "Tinh thần học hỏi và kiên nhẫn thực hành",
  ],

  categories: [
    { id: 1, name: "Lập trình" },
    { id: 2, name: "Python" },
  ],
  level: "Beginner",
  language: "Tiếng Việt",
  /** 12h 30m */
  duration: 45000,
  price: 299000,
  hasCertificate: true,

  instructor: {
    id: 10,
    firstName: "Nguyễn Hoàng",
    lastName: "Nam",
    title: "Senior Software Engineer & Python Developer",
    bio: "Tôi có hơn 8 năm kinh nghiệm phát triển phần mềm với Python, đã làm việc tại các công ty công nghệ lớn trong và ngoài nước. Tôi tin rằng ai cũng có thể học lập trình nếu được dạy đúng cách — từng bước, thực hành nhiều và không bỏ lại ai phía sau. Hiện tôi đang dạy cho hơn 28.000 học viên trên LearnHub.",
    avatarUrl: undefined,
    totalStudents: 28400,
    totalCourses: 5,
    avgRating: 4.9,
  },

  ratingSummary: {
    average: 4.8,
    total: 2340,
    breakdown: { 5: 1872, 4: 351, 3: 94, 2: 14, 1: 9 },
  },

  reviews: MOCK_REVIEWS,

  totalLessons: 12,
  totalStudents: 12500,
  lastUpdatedAt: "2026-03-01T00:00:00Z",
  createdAt: "2025-06-01T00:00:00Z",

  lessons: [
    { id: 1001, title: "Giới thiệu khóa học và lộ trình học", contentType: "video", duration: 480, order: 1, isFree: true },
    { id: 1002, title: "Cài đặt Python và VS Code", contentType: "video", duration: 720, order: 2, isFree: true },
    { id: 1003, title: "Chạy chương trình Python đầu tiên", contentType: "video", duration: 540, order: 3, isFree: false },
    { id: 1004, title: "Biến, kiểu dữ liệu và toán tử", contentType: "video", duration: 900, order: 4, isFree: false },
    { id: 1005, title: "Câu lệnh điều kiện if/elif/else", contentType: "video", duration: 780, order: 5, isFree: false },
    { id: 1006, title: "Vòng lặp for và while", contentType: "video", duration: 840, order: 6, isFree: false },
    { id: 1007, title: "Hàm (function) và module", contentType: "video", duration: 900, order: 7, isFree: false },
    { id: 1008, title: "List, Tuple, Dictionary và Set", contentType: "video", duration: 960, order: 8, isFree: false },
    { id: 1009, title: "Lập trình hướng đối tượng (OOP)", contentType: "video", duration: 1200, order: 9, isFree: false },
    { id: 1010, title: "Xử lý file và exception", contentType: "video", duration: 780, order: 10, isFree: false },
    { id: 1011, title: "Thư viện phổ biến: NumPy, Pandas, Flask", contentType: "video", duration: 1440, order: 11, isFree: false },
    { id: 1012, title: "Dự án cuối khoá: App quản lý công việc", contentType: "video", duration: 2400, order: 12, isFree: false },
  ],
};

// ---------------------------------------------------------------------------
// Mock enrollment (simulates "đã đăng ký, đang học")
// ---------------------------------------------------------------------------
export const MOCK_ENROLLMENT: Enrollment = {
  id: 501,
  courseId: 1,
  progress: 35,
  status: "active",
  enrolledAt: "2026-03-20T00:00:00Z",
  lastLessonId: 1031,
};

// ---------------------------------------------------------------------------
// Data access helpers — swap these out with real API hooks when backend is ready
// ---------------------------------------------------------------------------
export function getCourseById(id: number): CourseDetail | null {
  if (id === MOCK_COURSE.id || id > 0) return MOCK_COURSE;
  return null;
}
