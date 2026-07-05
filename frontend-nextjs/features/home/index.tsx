"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Compass,
  GraduationCap,
  Library,
  Play,
  Search,
  Sparkles,
  Target,
  Users,
  Wand2,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageLoader } from "@/components/PageLoader";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import { canAccessInstructor } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { useFeaturedCourses } from "./api/home.hooks";
import { CourseCard } from "./component/CourseCard";

const categories = [
  "Frontend",
  "Backend",
  "AI",
  "Thiết kế",
  "Dữ liệu",
  "Ngoại ngữ",
];

const learningTracks = [
  {
    title: "Khám phá bằng video ngắn",
    description: "Xem highlight trước để nắm ý chính, rồi quyết định học sâu hơn.",
    href: "/newsfeed",
    icon: Play,
    tone: "text-sky-600 bg-sky-500/10",
  },
  {
    title: "Học theo khóa học",
    description: "Theo dõi bài học, tiến độ và nội dung có cấu trúc rõ ràng.",
    href: "/courses/search",
    icon: Library,
    tone: "text-violet-600 bg-violet-500/10",
  },
  {
    title: "Tạo highlight từ bài giảng",
    description: "Biến video dài thành những đoạn ngắn dễ xem, dễ chia sẻ.",
    href: "/upload",
    icon: Wand2,
    tone: "text-emerald-600 bg-emerald-500/10",
  },
];

const feedHighlights = [
  "Học nhanh qua video ngắn",
  "Lưu bài học đáng xem lại",
  "Đi thẳng từ highlight sang khóa học",
];

export default function Home() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const { user, isAuthenticated } = useAuthState();
  const canUseStudio = canAccessInstructor(user?.role);
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
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/80 px-3 py-1.5 text-xs font-bold text-primary shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Tạo highlight video và học theo khóa học
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Biến bài giảng dài thành video ngắn, rồi học sâu bằng khóa học.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                LearnHub giúp giảng viên tạo highlight từ video bài giảng, còn
                người học khám phá kiến thức qua video ngắn trước khi đi vào
                khóa học đầy đủ.
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="flex max-w-2xl flex-col gap-2 rounded-2xl border border-border/70 bg-background p-2 shadow-lg shadow-primary/5 sm:flex-row"
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

            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/courses/search?q=${encodeURIComponent(category)}`}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {category}
                </Link>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-xl px-5 font-bold">
                <Link href={isAuthenticated ? "/my-courses" : "/newsfeed"}>
                  {isAuthenticated ? "Tiếp tục học" : "Xem video ngắn"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl px-5 font-bold"
              >
                <Link href={canUseStudio ? "/instructor/dashboard" : "/upload"}>
                  {canUseStudio ? "Mở Studio" : "Tạo Highlight"}
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-2xl shadow-primary/10">
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src="/homepage.png"
                  alt="Giao diện học tập LearnHub"
                  fill
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 py-12">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          {learningTracks.map((track) => (
            <Link key={track.title} href={track.href} className="group">
              <Card className="h-full rounded-xl border-border/70 transition-colors group-hover:border-primary/30">
                <CardContent className="flex h-full gap-4 p-5">
                  <div
                    className={cn(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                      track.tone,
                    )}
                  >
                    <track.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">{track.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {track.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-b border-border/70 bg-muted/30 py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wide text-primary">
              Dành cho giảng viên và người tạo nội dung
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Từ video bài giảng dài đến highlight dễ xem.
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              Tải video lên LearnHub, tạo các đoạn highlight ngắn, rồi gắn chúng
              với khóa học để người học khám phá nhanh trước khi học sâu.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button asChild size="lg" className="rounded-xl font-bold">
              <Link href={canUseStudio ? "/instructor/courses" : "/upload"}>
                {canUseStudio ? "Quản lý nội dung" : "Tạo Highlight"}
                <Wand2 className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl font-bold">
              <Link href="/newsfeed">
                Xem highlight mẫu
                <Play className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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
