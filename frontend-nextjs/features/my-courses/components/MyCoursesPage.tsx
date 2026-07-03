"use client";

import { useMyCourses } from "../api/my-courses.api";
import { EnrolledCourseCard } from "./EnrolledCourseCard";
import { Loader2, GraduationCap, Compass, BookOpen, Clock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Fragment } from "react";

export function MyCoursesPage() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyCourses();

  if (isLoading) {
    return (
      <div className="relative min-h-[70vh] flex flex-col items-center justify-center bg-linear-to-b from-background via-muted/5 to-background overflow-hidden">
        {/* Background Glow Blobs for loading state */}
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-medium">Đang tải danh sách khóa học...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-20 text-center relative z-10">
        <p className="text-destructive font-medium mb-4">Đã xảy ra lỗi khi tải danh sách khóa học.</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-full px-6">
          Thử lại
        </Button>
      </div>
    );
  }

  const pages = data?.pages || [];
  const isEmpty = pages.length === 0 || !pages[0]?.data || pages[0].data.length === 0;

  // Compute stats
  const allEnrollments = pages.flatMap((page) => page.data || []);
  const totalCourses = allEnrollments.length;
  const completedCourses = allEnrollments.filter(
    (e) => e.status === "completed" || e.progress >= 100
  ).length;
  const inProgressCourses = totalCourses - completedCourses;

  return (
    <div className="relative min-h-screen bg-linear-to-b from-background via-muted/10 to-background overflow-hidden pb-16">
      {/* Decorative background glow blobs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse duration-10000" />
      <div className="absolute top-1/3 -left-20 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="container mx-auto max-w-7xl py-8 px-4 md:px-8 relative z-10">
        {/* Header Dashboard Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-linear-to-br from-card via-card/85 to-muted/20 p-6 md:p-8 shadow-xs mb-8 md:mb-12">
          {/* Decorative background grid pattern inside banner */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-35 dark:opacity-10 pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-primary/15 rounded-xl shadow-xs">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
                  Hành trình học tập
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-linear-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent mb-3">
                Học tập của tôi
              </h1>
              <p className="text-muted-foreground text-base md:text-lg">
                Tiếp tục hành trình chinh phục kiến thức và theo dõi tiến độ học tập của bạn mỗi ngày.
              </p>
            </div>

            {/* Stats section */}
            {!isEmpty && (
              <div className="grid grid-cols-3 gap-4 shrink-0 sm:min-w-[360px] md:min-w-[420px]">
                {/* Stat 1 */}
                <div className="flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl bg-card/65 backdrop-blur-xs border border-border/40 shadow-xs hover:border-primary/30 transition-all duration-300">
                  <div className="p-2 bg-primary/10 rounded-lg mb-2 text-primary">
                    <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-xl md:text-2xl font-bold">{totalCourses}</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground text-center font-medium mt-0.5">Khóa học</span>
                </div>

                {/* Stat 2 */}
                <div className="flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl bg-card/65 backdrop-blur-xs border border-border/40 shadow-xs hover:border-accent/30 transition-all duration-300">
                  <div className="p-2 bg-accent/10 rounded-lg mb-2 text-accent">
                    <Clock className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-xl md:text-2xl font-bold">{inProgressCourses}</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground text-center font-medium mt-0.5">Đang học</span>
                </div>

                {/* Stat 3 */}
                <div className="flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl bg-card/65 backdrop-blur-xs border border-border/40 shadow-xs hover:border-green-500/30 transition-all duration-300">
                  <div className="p-2 bg-green-500/10 rounded-lg mb-2 text-green-600">
                    <Trophy className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className="text-xl md:text-2xl font-bold">{completedCourses}</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground text-center font-medium mt-0.5">Hoàn thành</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center bg-card/60 backdrop-blur-md rounded-3xl border border-border/50 p-8 md:p-16 text-center min-h-[45vh] shadow-xs relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] opacity-25 dark:opacity-5 pointer-events-none" />
            <div className="relative z-10 max-w-md mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center shadow-xs mx-auto mb-6 border border-primary/20 rotate-3 hover:rotate-12 transition-transform duration-300">
                <Compass className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Hành trình học tập đang chờ bạn!</h2>
              <p className="text-muted-foreground mb-8">
                Bạn chưa đăng ký tham gia khóa học nào. Hãy bắt đầu nâng cấp bản thân ngay hôm nay bằng cách khám phá các khóa học chất lượng cao của chúng tôi.
              </p>
              <Button asChild size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 transition-all hover:scale-102 hover:shadow-lg hover:shadow-primary/30">
                <Link href="/courses/search">Khám phá khóa học ngay</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pages.map((page, i) => (
                <Fragment key={i}>
                  {page.data.map((enrollment) => (
                    <EnrolledCourseCard key={enrollment.id} enrollment={enrollment} />
                  ))}
                </Fragment>
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-12 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="min-w-[200px] rounded-full border-border/80 hover:border-primary/50"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang tải thêm...
                    </>
                  ) : (
                    "Xem thêm"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
