export const BRAND = {
  name: "StudyLoop",
  shortName: "StudyLoop",
  tagline: "Học bằng video ngắn, hiểu bằng lộ trình",
  description:
    "Nền tảng biến video bài giảng dài thành video ngắn nổi bật, Studio chỉnh sửa trực quan và quy trình học tập tích hợp trắc nghiệm, bảng tin, khóa học.",
  logo: "/brand/studyloop-mark.svg",
  logoWordmark: "/brand/studyloop-logo.svg",
  logoDark: "/brand/studyloop-logo-dark.svg",
  icon: "/icon.svg",
  appleIcon: "/apple-touch-icon.png",
  ogImage: "/og-studyloop.png",
  supportEmail: "support@studyloop.edu.vn",
  copyright: "© 2026 StudyLoop. All rights reserved.",
  title: "StudyLoop - Học qua video ngắn và lộ trình thông minh",
  keywords: [
    "StudyLoop",
    "học trực tuyến",
    "video bài học ngắn",
    "video highlight",
    "video studio",
    "lộ trình học tập",
  ],
} as const;

export type BrandConfig = typeof BRAND;
