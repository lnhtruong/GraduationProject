"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Facebook,
  GraduationCap,
  Instagram,
  Mail,
  Star,
  Youtube,
  Target,
  Gamepad2,
  Scissors,
  BarChart2,
  ArrowRight,
  Youtube as YoutubeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedCourses } from "./api/home.hooks";
import type { FeaturedCourse } from "./types";

// ─── Static config (UI copy / icons – không cần từ backend) ─────────────────

const LEARNER_FEATURES = [
  {
    icon: Target,
    title: "Cá nhân hóa",
    desc: "Video đề xuất theo sở thích và trình độ của bạn",
  },
  {
    icon: Gamepad2,
    title: "Học như chơi",
    desc: "Quiz tương tác, streak, leaderboard kiểu Duolingo",
  },
  {
    icon: BookOpen,
    title: "Khóa học có cấu trúc",
    desc: "Từ highlight video đến bài học hoàn chỉnh",
  },
];

const TEACHER_FEATURES = [
  {
    icon: YoutubeIcon,
    title: "AI tạo video highlight",
    desc: "Tự động cắt điểm hay từ bài giảng dài",
  },
  {
    icon: Scissors,
    title: "Editor đơn giản",
    desc: "Thêm text, mascot, hiệu ứng như CapCut",
  },
  {
    icon: BarChart2,
    title: "Phân tích học viên",
    desc: "Theo dõi tiến độ và tương tác real-time",
  },
];

const FOOTER_LINKS = {
  "Sản phẩm": ["Dành cho học viên", "Dành cho giáo viên", "Dành cho trường học"],
  "Công ty": ["Về chúng tôi", "Blog", "Tuyển dụng"],
  "Hỗ trợ": ["Trung tâm trợ giúp", "Liên hệ", "Chính sách"],
};
// ─────────────────────────────────────────────────────────────────────────────

// ─── Sub-components ──────────────────────────────────────────────────────────

function CourseCard({ course }: { course: FeaturedCourse }) {
  return (
    <Link href={`/courses/${course.id}`}>
      <Card className="group overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 cursor-pointer h-full">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {/* TODO: Swap <img> for Next.js <Image> with real domain in next.config */}
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute top-2 left-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
            {course.category}
          </span>
        </div>

        <CardContent className="p-4 flex flex-col gap-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          <div className="flex items-center gap-1.5">
            {course.instructorAvatar ? (
              /* TODO: Replace with Next.js <Image> when real avatars available */
              <img
                src={course.instructorAvatar}
                alt={course.instructor}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                <GraduationCap className="h-3 w-3 text-muted-foreground" />
              </div>
            )}
            <span className="text-xs text-muted-foreground truncate">{course.instructor}</span>
          </div>

          {/* Rating + Price */}
          <div className="flex items-center justify-between pt-1">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              <span className="font-medium text-foreground">{course.rating}</span>
              <span>({course.reviewCount.toLocaleString()})</span>
            </span>
            {course.price !== null ? (
              <span className="text-sm font-bold text-foreground">
                {course.price.toLocaleString()}đ
              </span>
            ) : (
              <span className="text-sm font-bold text-primary">Miễn phí</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CourseCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/60 h-full">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4 flex flex-col gap-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState<"learner" | "teacher">("learner");
  const features = activeTab === "learner" ? LEARNER_FEATURES : TEACHER_FEATURES;

  const { data: featuredCourses, isLoading: coursesLoading } = useFeaturedCourses();

  return (
    <div className="min-h-screen bg-background font-sans">

      {/* ── 1. Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background -z-10" />

        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Text */}
            <div className="flex flex-col gap-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-foreground">
                Học mọi thứ qua
                <br />
                video ngắn.{" "}
                <span className="text-primary">Dạy dễ</span>
                <br />
                <span className="text-primary">hơn với AI.</span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
                Nền tảng giáo dục tích hợp AI tạo video highlight, cá nhân hóa trải
                nghiệm học tập cho mọi người.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="px-8 rounded-full shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all"
                  asChild
                >
                  <Link href="/upload">Bắt đầu học</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 rounded-full hover:border-primary/40 hover:text-primary transition-all"
                  asChild
                >
                  <Link href="/upload">Tôi là giáo viên</Link>
                </Button>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-72 h-72 bg-primary/20 rounded-full blur-[80px]" />
              </div>
              <div className="relative z-10 w-64 md:w-72 aspect-[9/18] rounded-[2.5rem] border-[6px] border-foreground/10 bg-muted overflow-hidden shadow-2xl">
                {/* TODO: Replace with real app screenshot */}
                <img
                  src="/homepage.png"
                  alt="App preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. Features – Tab toggle ─────────────────────────────────────────── */}
      <section className="py-16 bg-muted/30 border-t border-border/40">
        <div className="container mx-auto px-6 lg:px-8">

          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center bg-background border border-border rounded-full p-1 shadow-xs">
              {(["learner", "teacher"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "learner" ? "Dành cho người học" : "Dành cho giáo viên"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {features.map((feat) => (
              <Card
                key={feat.title}
                className="border-border/60 hover:border-primary/30 hover:shadow-sm transition-all duration-300"
              >
                <CardContent className="p-6 flex flex-col gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                    <feat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-1">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* ── 3. Featured Courses ──────────────────────────────────────────────── */}
      <section className="py-16 border-t border-border/40">
        <div className="container mx-auto px-6 lg:px-8">

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Khóa học nổi bật
            </h2>
            <Link
              href="/courses"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Xem tất cả khóa học <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {coursesLoading
              ? Array.from({ length: 4 }).map((_, i) => <CourseCardSkeleton key={i} />)
              : featuredCourses?.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
          </div>

        </div>
      </section>

      {/* ── 4. Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-12 bg-background">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

            <div>
              <Link href="/" className="inline-block mb-3">
                <span className="text-2xl font-extrabold text-primary">EduFlow</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Học thông minh hơn, dạy hiệu quả hơn
              </p>
              <div className="flex gap-3">
                {[Facebook, Instagram, Youtube, Mail].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {Object.entries(FOOTER_LINKS).map(([title, links]) => (
              <div key={title}>
                <h4 className="font-bold text-sm mb-4">{title}</h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link}>
                      {/* TODO: Replace # with actual routes */}
                      <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>

          <div className="border-t border-border/40 pt-6 text-center">
            <p className="text-sm text-muted-foreground">© 2026 EduFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
