"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, GraduationCap, Play, Search } from "lucide-react";
import { motion } from "framer-motion";

import { PageLoader } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import { BRAND } from "@/lib/brand";
import { useFeaturedCourses } from "./api/home.hooks";
import { CourseCard } from "./component/CourseCard";

const demoCases = [
  {
    id: "toeic-participles",
    course: "TOEIC Grammar Foundation",
    longTitle: "TOEIC Grammar: Participles",
    longDuration: "49:53",
    longVideo:
      "https://vz-e0f2a12f-935.b-cdn.net/f3377768-3355-469c-9f1e-f6d010f9969f/play_360p.mp4",
    longThumbnail:
      "https://vz-e0f2a12f-935.b-cdn.net/10506623-c382-4062-bb6c-27c8185fed19/thumbnail.jpg",
    shortTitle: "Introduction to Participles",
    shortDuration: "02:00",
    videoId: 32,
    shortVideo:
      "https://res.cloudinary.com/dbwqzrbur/video/upload/v1779542387/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/1/highlight_topic1_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.mp4",
    shortThumbnail:
      "https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_640,h_360/v1779542387/jobs/7470b5e8-d2ae-4c23-a81d-bb53e2366ccb/topics/1/highlight_topic1_7470b5e8-d2ae-4c23-a81d-bb53e2366ccb.jpg",
  },
  {
    id: "toeic-two-verbs",
    course: "TOEIC Grammar Foundation",
    longTitle: "TOEIC Grammar: To V1, V-ing",
    longDuration: "49:53",
    longVideo:
      "https://vz-e0f2a12f-935.b-cdn.net/f3377768-3355-469c-9f1e-f6d010f9969f/play_360p.mp4",
    longThumbnail:
      "https://vz-e0f2a12f-935.b-cdn.net/f3377768-3355-469c-9f1e-f6d010f9969f/thumbnail.jpg",
    shortTitle: "Two-Verb Structures",
    shortDuration: "02:05",
    videoId: 35,
    shortVideo:
      "https://res.cloudinary.com/dbwqzrbur/video/upload/v1779543612/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/1/highlight_topic1_f451598a-dde9-448f-ac7e-2cc54a453379.mp4",
    shortThumbnail:
      "https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_640,h_360/v1779543612/jobs/f451598a-dde9-448f-ac7e-2cc54a453379/topics/1/highlight_topic1_f451598a-dde9-448f-ac7e-2cc54a453379.jpg",
  },
  {
    id: "toeic-tenses",
    course: "TOEIC Grammar Foundation",
    longTitle: "TOEIC Grammar: Tenses",
    longDuration: "1:20:33",
    longVideo:
      "https://vz-e0f2a12f-935.b-cdn.net/f53ee3cc-c963-43dd-883b-99fcd55c07cf/play_360p.mp4",
    longThumbnail:
      "https://vz-e0f2a12f-935.b-cdn.net/f53ee3cc-c963-43dd-883b-99fcd55c07cf/thumbnail.jpg",
    shortTitle: "Common Tenses in TOEIC",
    shortDuration: "02:49",
    videoId: 42,
    shortVideo:
      "https://res.cloudinary.com/dbwqzrbur/video/upload/v1779544415/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/1/highlight_topic1_2e069ab1-fe01-486c-a863-8d307e338fe8.mp4",
    shortThumbnail:
      "https://res.cloudinary.com/dbwqzrbur/video/upload/so_2,c_thumb,w_640,h_360/v1779544415/jobs/2e069ab1-fe01-486c-a863-8d307e338fe8/topics/1/highlight_topic1_2e069ab1-fe01-486c-a863-8d307e338fe8.jpg",
  },
];

const feedMoments = [
  "Xem nhanh nội dung chính trước khi học sâu",
  "Lưu đoạn cần ôn lại trong feed",
  "Mở khóa học liên quan khi muốn học đầy đủ",
];

export default function Home() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const { user } = useAuthState();
  const uploadHref = user ? "/upload" : "/signin?returnUrl=%2Fupload";
  const { data: featuredCourses, isLoading: coursesLoading } =
    useFeaturedCourses();

  const activeDemo = demoCases[0];
  const newsfeedHref = `/newsfeed?videoId=${activeDemo.videoId}`;

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
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:py-14">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-bold text-primary">{BRAND.name}</p>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Biến bài giảng dài thành video ngắn để học dễ hơn.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Từ một video bài giảng, bạn có thể tạo highlight, chỉnh nhanh
                trong Studio rồi dùng lại ở feed, quiz hoặc bài học.
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

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="w-full rounded-xl px-5 font-bold sm:w-auto"
              >
                <Link href={uploadHref}>
                  Tạo highlight
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full rounded-xl px-5 font-bold sm:w-auto"
              >
                <Link href={newsfeedHref}>
                  Lướt xem feed
                  <Play className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl shadow-primary/10">
            <div className="relative aspect-[4/3]">
              <Image
                src="/homepage.png"
                alt={`${BRAND.name} homepage preview`}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 46vw"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border/70 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-7">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
              Luồng highlight
            </p>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Video dài được rút thành highlight ngắn.
            </h2>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm sm:p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
              <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
                <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Video gốc
                    </p>
                    <h3 className="mt-1 line-clamp-1 text-base font-black text-foreground">
                      {activeDemo.longTitle}
                    </h3>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-primary">
                    {activeDemo.longDuration}
                  </span>
                </div>
                <div className="relative aspect-video bg-muted">
                  <video
                    className="h-full w-full object-cover"
                    src={activeDemo.longVideo}
                    poster={activeDemo.longThumbnail}
                    preload="metadata"
                    playsInline
                    controls
                  />
                  <div className="absolute left-4 top-4 rounded-lg bg-background/95 px-3 py-1 text-xs font-bold text-foreground shadow-sm">
                    Bài giảng đầy đủ
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center lg:px-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-primary shadow-sm lg:h-12 lg:w-12">
                  <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-primary/30 bg-card">
                <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Highlight
                    </p>
                    <h3 className="mt-1 line-clamp-1 text-base font-black text-foreground">
                      {activeDemo.shortTitle}
                    </h3>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-primary">
                    {activeDemo.shortDuration}
                  </span>
                </div>
                <div className="relative aspect-video bg-muted">
                  <video
                    className="h-full w-full object-cover"
                    src={activeDemo.shortVideo}
                    poster={activeDemo.shortThumbnail}
                    muted
                    loop
                    playsInline
                    autoPlay
                    controls
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button asChild className="rounded-xl font-bold">
                <Link href={newsfeedHref}>Xem trên feed</Link>
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
                Khóa học nổi bật
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Học sâu hơn sau khi xem highlight.
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
            <PageLoader message="Đang tải khóa học..." className="py-12" />
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
              <p className="mt-3 font-semibold">Chưa có khóa học nổi bật.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Khi có dữ liệu học tập, các khóa học phù hợp sẽ xuất hiện ở đây.
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
              Video ngắn giúp mở đầu một phiên học nhanh hơn.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              Feed không thay thế khóa học. Nó giúp người học xem nhanh, lưu lại
              đoạn cần nhớ và quay về bài học đầy đủ khi muốn học sâu.
            </p>
            <Button asChild className="rounded-xl">
              <Link href={newsfeedHref}>
                Lướt xem feed
                <Play className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-3">
            {feedMoments.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-border/70 bg-background p-4 text-sm font-semibold"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
