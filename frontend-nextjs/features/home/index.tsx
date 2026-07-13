"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Play,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/PageLoader";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import { useFeaturedCourses } from "./api/home.hooks";
import { CourseCard } from "./component/CourseCard";

const feedHighlights = [
  "Học nhanh qua video ngắn",
  "Lưu bài học đáng xem lại",
  "Đi thẳng từ highlight sang khóa học",
];

const workflowSteps = [
  {
    title: "Tải video bài giảng",
    description:
      "Tải video dài lên LearnHub hoặc chọn video đã có trong thư viện.",
  },
  {
    title: "Chọn kiểu highlight",
    description:
      "Chọn một đoạn hay nhất hoặc nhiều đoạn theo chủ đề để xem lại, chia sẻ hoặc gắn vào bài học.",
  },
  {
    title: "Hoàn thiện trong Studio",
    description:
      "Mở video ngắn trong Studio để thêm chữ, mascot hoặc chỉnh lại trước khi lưu.",
  },
];

export default function Home() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const { user } = useAuthState();
  const uploadHref = user ? "/upload" : "/signin?returnUrl=%2Fupload";
  const { data: featuredCourses, isLoading: coursesLoading } =
    useFeaturedCourses();

  const visibleCourses = useMemo(
    () => (featuredCourses ?? []).slice(0, 8),
    [featuredCourses],
  );

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
      <section className="border-b border-border/70 bg-linear-to-b from-primary/8 via-background to-background">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-14">
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Biến bài giảng dài thành video ngắn để học dễ hơn.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Tải video bài giảng lên, chọn cách cắt highlight, chỉnh nhanh trong
                Studio nếu cần rồi xuất bản vào feed hoặc khóa học.
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex max-w-2xl flex-col gap-2 rounded-xl border border-border/70 bg-background p-2 shadow-sm sm:flex-row"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
                <input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Bạn muốn học gì hôm nay?"
                  className="h-11 min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground"
                />
              </div>
              <Button type="submit" className="h-11 rounded-xl px-6 font-bold">
                Tìm khóa học
              </Button>
            </form>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl px-5 font-bold">
                <Link href={uploadHref}>
                  Tạo highlight
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl px-5 font-bold"
              >
                <Link href="/courses/search">Tìm khóa học</Link>
              </Button>
            </div>

          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/10">
              <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                <div>
                  <h2 className="text-base font-black text-foreground">
                    Video ngắn sau khi cắt
                  </h2>
                </div>
              </div>
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src="/homepage.png"
                  alt="Giao diện học tập LearnHub"
                  fill
                  priority
                  className="object-cover"
                />
                <div className="absolute inset-x-4 bottom-4 rounded-xl bg-background/95 p-3 shadow-lg backdrop-blur">
                  <div className="flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
                    <span>Dòng thời gian</span>
                    <span>Highlight 02:14</span>
                  </div>
                  <div className="mt-2 grid h-8 grid-cols-[1.2fr_0.7fr_1fr] gap-1">
                    <div className="rounded-md bg-primary/25" />
                    <div className="rounded-md bg-violet-500/25" />
                    <div className="rounded-md bg-emerald-500/25" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 max-w-3xl">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Một bài giảng có thể thành nhiều điểm chạm học tập.
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              Video dài có thể được cắt thành các đoạn ngắn để xem lại, chia sẻ
              trên feed hoặc gắn vào bài học khi cần học sâu hơn.
            </p>
          </div>

          <div className="grid overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-border/70 p-4 sm:p-5 lg:border-b-0 lg:border-r">
              <div className="relative overflow-hidden rounded-xl bg-muted">
                <div className="relative aspect-video">
                  <Image
                    src="/homepage.png"
                    alt="Video dài được cắt thành highlight"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="absolute inset-x-3 bottom-3 rounded-xl bg-background/95 p-3 shadow-sm backdrop-blur">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Video dài 58:21</span>
                    <span>Đã tạo 3 highlight</span>
                  </div>
                  <div className="mt-2 grid h-7 grid-cols-[1.2fr_0.8fr_1fr] gap-1.5">
                    <div className="rounded-md bg-primary/30" />
                    <div className="rounded-md bg-emerald-500/25" />
                    <div className="rounded-md bg-sky-500/25" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <div className="divide-y divide-border/70">
                {workflowSteps.map((step, index) => (
                  <div key={step.title} className="flex gap-3 py-4">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-black text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Button asChild className="mt-2 w-full rounded-xl font-bold">
                <Link href={uploadHref}>
                  Tạo highlight từ video
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Được học viên quan tâm
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Khóa học có nhiều lượt học
              </h2>
            </div>
            <Button asChild variant="outline" className="w-fit rounded-xl">
              <Link href="/courses/search?sort=popular">
                Khám phá thêm
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {coursesLoading ? (
            <PageLoader message="Đang tải khóa học được quan tâm..." className="py-12" />
          ) : visibleCourses.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {visibleCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </motion.div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-semibold">Chưa có khóa học được quan tâm.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Khi có học viên đăng ký, các khóa học phổ biến sẽ xuất hiện ở đây.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-border/70 bg-muted/30 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="space-y-4">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Newsfeed học tập
            </p>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Học nhẹ hơn bằng những đoạn video đáng xem.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Newsfeed không thay thế khóa học, nó giúp bạn khám phá nhanh nội
              dung hay, lưu lại ý tưởng và mở khóa học liên quan khi muốn học sâu.
            </p>
            <Button asChild className="rounded-xl">
              <Link href="/newsfeed">
                Mở Newsfeed
                <Play className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3">
            {feedHighlights.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-4"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
