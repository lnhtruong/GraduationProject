import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Nền tảng học tập qua video ngắn thông minh",
  description: "Khám phá khóa học, video bài học ngắn và công cụ học tập thông minh trên StudyLoop.",
  path: "/",
});

import Home from "@/features/home";

export default function HomePage() {
  return <Home />;
}
