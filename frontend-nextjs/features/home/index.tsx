"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { ArrowRight, Play, Search, Video } from "lucide-react";
import { FaGraduationCap, FaPlayCircle } from "react-icons/fa";

import { PageLoader } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import { CourseCard } from "@/features/home/component/CourseCard";
import { SectionHeader } from "@/features/home/component/SectionHeader";
import { TrendingFeedCard } from "@/features/home/component/TrendingFeedCard";
import {
  useHomePopularCourses,
  useHomeTrendingFeed,
} from "./api/home.hooks";

const HeroMotionScene = dynamic(
  () =>
    import("@/features/home/component/HeroMotionScene").then(
      (module) => module.HeroMotionScene,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[24rem] rounded-lg border border-border/70 bg-card/70" />
    ),
  },
);

const HighlightShowcase = dynamic(
  () =>
    import("@/features/home/component/HighlightShowcase").then(
      (module) => module.HighlightShowcase,
    ),
  {
    ssr: false,
    loading: () => <section className="min-h-[36rem] bg-background" />,
  },
);
export default function Home() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const { isAuthenticated } = useAuthState();
  const uploadHref = isAuthenticated ? "/upload" : "/signin?returnUrl=%2Fupload";

  const popularCoursesQuery = useHomePopularCourses();
  const trendingFeedQuery = useHomeTrendingFeed();

  const popularCourses = popularCoursesQuery.data ?? [];
  const trendingFeed = trendingFeedQuery.data?.items ?? [];

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchValue.trim();
    router.push(
      query
        ? `/courses/search?q=${encodeURIComponent(query)}`
        : "/courses/search",
    );
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="overflow-hidden border-b border-border/70 bg-linear-to-b from-primary/8 via-background to-background">
        <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[96rem] items-center gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-12 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:gap-10">
          <div className="min-w-0 lg:max-w-3xl xl:max-w-none">
            <span className="inline-flex rounded-full bg-primary px-3 py-1 text-xs font-black text-primary-foreground">
              StudyLoop
            </span>
            <h1 className="mt-5 max-w-[46rem] text-balance text-[clamp(2.65rem,4.55vw,4.35rem)] font-black leading-[1.06] tracking-tight text-foreground">
              Học bằng khóa học sâu, ôn bằng video ngắn.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              StudyLoop kết nối course marketplace, highlight feed và studio AI
              để một bài giảng có thể trở thành nhiều điểm chạm học tập.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-7 flex items-center gap-3 rounded-[1.2rem] border border-border/70 bg-background p-1.5 pl-4 shadow-lg shadow-black/5 sm:mt-8 sm:p-2 sm:pl-5"
            >
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Bạn muốn học gì hôm nay?"
                aria-label="Tìm khóa học"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm font-semibold outline-none placeholder:text-muted-foreground sm:text-base"
              />
              <Button
                type="submit"
                size="icon"
                aria-label="Tìm khóa học"
                className="h-10 w-10 shrink-0 rounded-xl shadow-md shadow-primary/20 sm:h-12 sm:w-12 sm:rounded-[0.95rem]"
              >
                <Search className="h-5 w-5" />
              </Button>
            </form>

            <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-7 sm:gap-3">
              <Button
                asChild
                size="lg"
                className="h-10 rounded-xl px-4 text-sm font-black leading-none shadow-lg shadow-primary/20 sm:h-12 sm:px-5 sm:text-base"
              >
                <Link href="/courses/search">
                  Khám phá
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-10 rounded-xl border-border/70 bg-background px-4 text-sm font-black leading-none text-foreground shadow-sm hover:border-primary/40 hover:bg-primary/10 hover:text-foreground dark:bg-card dark:hover:bg-primary/15 sm:h-12 sm:px-5 sm:text-base"
              >
                <Link href="/newsfeed">
                  Feed
                  <Play className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-10 rounded-xl border-border/70 bg-background px-4 text-sm font-black leading-none text-foreground shadow-sm hover:border-primary/40 hover:bg-primary/10 hover:text-foreground dark:bg-card dark:hover:bg-primary/15 sm:h-12 sm:px-5 sm:text-base"
              >
                <Link href={uploadHref}>
                  Tạo highlight
                  <Video className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="w-full min-w-0 lg:mx-auto lg:max-w-4xl xl:mx-0 xl:max-w-[52rem] xl:justify-self-end">
            <HeroMotionScene items={trendingFeed} />
          </div>
        </div>
      </section>

      {/*
        <section className="border-b border-border/70 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeader
              icon={<Play className="h-3.5 w-3.5 fill-current" />}
              eyebrow="Tiếp tục học"
              title="Quay lại bài đang xem dở."
              action={
                <Button
                  asChild
                  variant="outline"
                  className="w-fit rounded-xl border-border/70 bg-background text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-foreground dark:bg-card dark:hover:bg-primary/15"
                >
                  <Link href="/my-courses">
                    Khóa học của tôi
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
            {continueWatchingQuery.isLoading ? (
              <PageLoader message="Đang tải tiến độ học..." className="py-8" />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {continueWatching.map((item) => (
                  <ContinueWatchingCard key={item.lessonProgressId} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>
      */}

      <HighlightShowcase
        uploadHref={uploadHref}
      />

      <section className="border-b border-border/70 py-10 md:py-14 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center xl:min-h-[calc(100svh-4rem)]">
        <div className="mx-auto w-full max-w-[96rem] px-4 sm:px-6 lg:px-8">
          <SectionHeader
            icon={<Video className="h-3.5 w-3.5" />}
            eyebrow="Trending feed"
            title="Những đoạn học ngắn đang được xem nhiều."
            action={
              <Button
                asChild
                variant="outline"
                className="w-fit rounded-xl border-border/70 bg-background text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-foreground dark:bg-card dark:hover:bg-primary/15"
              >
                <Link href="/newsfeed">
                  Mở bảng tin
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            }
          />

          {trendingFeedQuery.isLoading ? (
            <PageLoader message="Đang tải video nổi bật..." className="py-10" />
          ) : trendingFeed.length > 0 ? (
            <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
              <TrendingFeedCard item={trendingFeed[0]} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {trendingFeed.slice(1, 5).map((item) => (
                  <TrendingFeedCard
                    key={item.feedId}
                    item={item}
                    variant="compact"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <FaPlayCircle className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-semibold">Chưa có video trending.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-10 md:py-14 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center xl:min-h-[calc(100svh-4rem)]">
        <div className="mx-auto w-full max-w-[96rem] px-4 sm:px-6 lg:px-8">
          <SectionHeader
            icon={<FaGraduationCap className="h-3.5 w-3.5" />}
            eyebrow="Khóa học nổi bật"
            title="Học sâu hơn sau khi xem highlight."
            action={
              <Button
                asChild
                variant="outline"
                className="w-fit rounded-xl border-border/70 bg-background text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-foreground dark:bg-card dark:hover:bg-primary/15"
              >
                <Link href="/courses/search?sort=popular">
                  Khám phá thêm
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            }
          />

          {popularCoursesQuery.isLoading ? (
            <PageLoader message="Đang tải khóa học..." className="py-12" />
          ) : popularCourses.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pb-0 lg:grid-cols-4 xl:gap-6">
              {popularCourses.slice(0, 4).map((course) => (
                <div key={course.id} className="w-[280px] shrink-0 sm:w-auto">
                  <CourseCard course={course} />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
              <FaGraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-semibold">Chưa có khóa học nổi bật.</p>
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
