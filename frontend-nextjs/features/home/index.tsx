"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Target,
  Gamepad2,
  Scissors,
  BarChart2,
  ArrowRight,
  Youtube as YoutubeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFeaturedCourses } from "./api/home.hooks";
import { PageLoader } from "@/components/PageLoader";
import { CourseCard } from "./component/CourseCard";
import { useContinueWatchingList } from "@/features/courses/learn/api/lesson-progress.hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthState } from "@/features/auth/hooks/useAuth";

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

// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState<"learner" | "teacher">("learner");
  const features =
    activeTab === "learner" ? LEARNER_FEATURES : TEACHER_FEATURES;
  const { isAuthenticated } = useAuthState();

  const { data: featuredCourses, isLoading: coursesLoading } =
    useFeaturedCourses();
  const { data: continueWatchingList, isLoading: continueWatchingLoading } =
    useContinueWatchingList(10, isAuthenticated);

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* ── 1. Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 lg:py-24">
        <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-background to-background -z-10" />

        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="flex flex-col gap-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-foreground">
                Học mọi thứ qua
                <br />
                video ngắn. <span className="text-primary">Dạy dễ</span>
                <br />
                <span className="text-primary">hơn với AI.</span>
              </h1>

              <p className="text-base md:text-lg text-muted-foreground max-w-md leading-relaxed">
                Nền tảng giáo dục tích hợp AI tạo video highlight, cá nhân hóa
                trải nghiệm học tập cho mọi người.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  className="px-8 rounded-full shadow-md shadow-primary/20 hover:-translate-y-0.5 transition-all"
                  asChild
                >
                  <Link href="/newsfeed">Bắt đầu học</Link>
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
              <div className="relative z-10 w-64 md:w-72 aspect-9/18 rounded-[2.5rem] border-[6px] border-foreground/10 bg-muted overflow-hidden shadow-2xl">
                <Image
                  src="/homepage.png"
                  alt="App preview"
                  fill
                  priority
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
                  {tab === "learner"
                    ? "Dành cho người học"
                    : "Dành cho giáo viên"}
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
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Tiếp tục học — chỉ hiện khi đã login và có data ─────────────── */}
      {isAuthenticated && (continueWatchingLoading || !!continueWatchingList?.length) && (
        <section className="py-14 border-t border-border/40">
          <div className="container mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Tiếp tục học
              </h2>
            </div>

            {continueWatchingLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Card
                    key={`continue-skeleton-${index}`}
                    className="overflow-hidden border-border/60"
                  >
                    <CardContent className="p-0">
                      <Skeleton className="aspect-video w-full rounded-none" />
                      <div className="space-y-3 p-4">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-5 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-9 w-36 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {continueWatchingList!.map((item) => (
                  <Link
                    key={`${item.lessonProgressId}-${item.lessonId}`}
                    href={`/courses/${item.courseId}/learn?lessonId=${item.lessonId}&resume=1&resumeSec=${Math.max(0, item.lastVideoPositionMs / 1000)}`}
                  >
                    <Card className="group h-full overflow-hidden border-border/60 bg-card/90 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg">
                      <CardContent className="p-0">
                        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-slate-900 via-slate-700 to-slate-950">
                          {item.thumbnailUrl ? (
                            <Image
                              src={item.thumbnailUrl}
                              alt={item.lessonTitle}
                              fill
                              unoptimized
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : null}
                          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                          <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                            Tiếp tục học
                          </div>
                        </div>

                        <div className="space-y-3 p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground line-clamp-1">
                            {item.courseTitle}
                          </p>
                          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground">
                            {item.lessonTitle}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Đã xem đến{" "}
                            {Math.floor(item.lastVideoPositionMs / 1000 / 60)}:
                            {String(
                              Math.floor((item.lastVideoPositionMs / 1000) % 60),
                            ).padStart(2, "0")}
                          </p>
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              className="rounded-full px-4 shadow-sm"
                              variant="outline"
                            >
                              Tiếp tục <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

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
            {coursesLoading ? (
              <div className="col-span-full">
                <PageLoader
                  message="Đang tải khóa học nổi bật..."
                  className="py-10"
                />
              </div>
            ) : (
              featuredCourses?.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
