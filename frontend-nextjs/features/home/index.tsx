"use client";

import {
  FormEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  MessageCircle,
  MousePointer2,
  Play,
  Search,
  Video,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaGraduationCap,
  FaPlayCircle,
} from "react-icons/fa";

import { PageLoader } from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import { CourseCard } from "@/features/home/component/CourseCard";
import type { NewsfeedItem } from "@/features/newsfeed/types";
import {
  useHomePopularCourses,
  useHomeTrendingFeed,
  useHomeTrendingHashtags,
} from "./api/home.hooks";

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

const studioWorkflowSteps = [
  {
    title: "Nhận bài giảng gốc",
    description: "Giữ video dài, metadata và khóa học gốc trong cùng một luồng.",
    icon: Video,
  },
  {
    title: "Tách ý chính",
    description: "Chọn khoảnh khắc đáng học lại, rút còn đoạn ngắn dễ xem.",
    icon: Brain,
  },
  {
    title: "Tạo điểm tương tác",
    description: "Sinh quiz, caption và ngữ cảnh để người học ôn ngay.",
    icon: MessageCircle,
  },
  {
    title: "Nối về khóa học",
    description: "Người học xem nhanh trên feed rồi quay lại bài đầy đủ.",
    icon: BookOpenCheck,
  },
];

type HeroShowcaseClip = {
  id: string;
  title: string;
  thumbnail: string | null;
  videoUrl: string | null;
  courseName: string;
};

const heroFallbackClips: HeroShowcaseClip[] = [
  {
    id: "clip-idea",
    title: "Ý chính của bài học",
    thumbnail: null,
    videoUrl: null,
    courseName: "AI learning studio",
  },
  {
    id: "clip-quiz",
    title: "Câu hỏi ôn nhanh",
    thumbnail: null,
    videoUrl: null,
    courseName: "Quiz review",
  },
  {
    id: "clip-feed",
    title: "Đoạn lưu vào feed",
    thumbnail: null,
    videoUrl: null,
    courseName: "Study feed",
  },
  {
    id: "clip-course",
    title: "Quay lại bài đầy đủ",
    thumbnail: null,
    videoUrl: null,
    courseName: "Course link",
  },
];

const heroFallbackSourceClips: HeroShowcaseClip[] = demoCases.map((item) => ({
  id: `${item.id}-source`,
  title: item.longTitle,
  thumbnail: item.longThumbnail,
  videoUrl: item.longVideo,
  courseName: item.course,
}));

function CalmHeroPreview({
  items,
}: {
  items: NewsfeedItem[];
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const sourceDurationMs = 4300;
  const clickDurationMs = 950;
  const processingDurationMs = 2600;
  const resultsDurationMs = 2600;
  const clearingDurationMs = 850;
  const progressDurationMs = processingDurationMs;
  const visibleOffsets = [-1, 0, 1, 2];
  const apiClips = items.slice(0, 8).map((item) => ({
    id: String(item.feedId),
    title: item.title,
    thumbnail: item.thumbnail,
    videoUrl: item.videoUrl,
    courseName: item.course.name,
  }));
  const clips = apiClips.length >= 3 ? apiClips : heroFallbackClips;
  const sourceClipsFromFeed = items
    .filter((item) => Boolean(item.videoUrl || item.thumbnail))
    .map((item) => ({
      id: `source-${item.feedId}`,
      title: item.course.name
        ? `${item.course.name}: ${item.title}`
        : item.title,
      thumbnail: item.thumbnail ?? item.course.thumbnail ?? null,
      videoUrl: item.videoUrl,
      courseName: item.course.name,
    }))
    .filter((item, index, list) => {
      const key = item.videoUrl || item.thumbnail || item.title;
      return (
        list.findIndex(
          (candidate) =>
            (candidate.videoUrl || candidate.thumbnail || candidate.title) ===
            key,
        ) === index
      );
    });
  const sourceClips =
    sourceClipsFromFeed.length >= 3
      ? sourceClipsFromFeed
      : [...sourceClipsFromFeed, ...heroFallbackSourceClips];
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] =
    useState<"source" | "click" | "processing" | "results" | "clearing">(
      "source",
    );
  const [isVisible, setIsVisible] = useState(true);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const activeClip = clips[activeIndex % clips.length];
  const sourceClip = sourceClips[activeIndex % sourceClips.length];
  const displayClip = sourceClip;
  const isDemoPlaying = isVisible && isPageVisible;
  const shouldAdvance = isDemoPlaying;
  const isOutputPhase = phase === "results" || phase === "clearing";
  const visibleCards = visibleOffsets.map((offset) => {
    const clipIndex = (activeIndex + offset + clips.length) % clips.length;
    return { clip: clips[clipIndex], offset };
  });

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.3 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibility = () => setIsPageVisible(!document.hidden);
    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const handleBreakpoint = () => setIsMobile(mediaQuery.matches);
    handleBreakpoint();
    mediaQuery.addEventListener("change", handleBreakpoint);
    return () => mediaQuery.removeEventListener("change", handleBreakpoint);
  }, []);

  useEffect(() => {
    if (!shouldAdvance) return;

    const delay =
      phase === "source"
        ? sourceDurationMs
        : phase === "click"
          ? clickDurationMs
          : phase === "processing"
            ? processingDurationMs
            : phase === "results"
              ? resultsDurationMs
              : clearingDurationMs;
    const timer = window.setTimeout(() => {
      if (phase === "source") {
        setPhase("click");
        return;
      }

      if (phase === "click") {
        setPhase("processing");
        return;
      }

      if (phase === "processing") {
        setPhase("results");
        return;
      }

      if (phase === "results") {
        setPhase("clearing");
        return;
      }

      setActiveIndex((current) => (current + 1) % clips.length);
      setPhase("source");
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    activeIndex,
    clearingDurationMs,
    clickDurationMs,
    clips.length,
    phase,
    processingDurationMs,
    resultsDurationMs,
    shouldAdvance,
    sourceDurationMs,
  ]);

  const statusLabel = !isDemoPlaying
    ? "Demo tạm dừng"
    : phase === "source"
      ? "Đang phát clip gốc"
      : phase === "click" || phase === "processing"
        ? "AI đang tạo highlight"
        : phase === "results"
          ? "Highlight đã sẵn sàng"
          : "Đang chuyển clip mới";

  return (
    <div
      ref={stageRef}
      data-home-hero-phase={phase}
      className="relative overflow-hidden rounded-[1.25rem] border border-black/10 bg-[#f1eee7] text-[#171a1b] shadow-[0_24px_62px_rgba(55,45,25,0.16)] dark:border-white/[0.13] dark:bg-[#0d1313] dark:text-white dark:shadow-[0_28px_78px_rgba(0,0,0,0.46)] sm:h-[500px] sm:rounded-[1.8rem] md:h-[540px] lg:h-[580px] xl:h-[590px]"
    >
      <HeroBackgroundEffects />

      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-black/60 dark:text-white/70 sm:text-xs">
          <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_18px_rgba(255,152,0,0.9)]" />
          StudyLoop AI Studio
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-black/55 dark:text-white/65 sm:text-xs">
          <span
            className={`h-1.5 w-1.5 rounded-full ${isDemoPlaying ? "animate-pulse bg-primary" : "bg-black/30 dark:bg-white/35"}`}
          />
          {statusLabel}
        </div>
      </div>

      <div className="relative z-10 px-3 pb-4 pt-14 sm:hidden">
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-black/10 bg-black shadow-[0_16px_34px_rgba(0,0,0,0.24)]">
          <HeroMedia
            key={`mobile-main-${phase}-${displayClip.id}`}
            clip={displayClip}
            sizes="(max-width: 640px) 100vw, 430px"
            playVideo={isDemoPlaying && isMobile}
            priority={activeIndex === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <p className="text-[10px] font-bold uppercase tracking-wide text-primary">
              Clip gốc
            </p>
            <p className="mt-1 line-clamp-1 text-sm font-black">
              {displayClip.title}
            </p>
          </div>
        </div>

        <HeroAnalysisBar compact phase={phase} />
        <HeroProgress
          activeKey={`generation-${activeClip.id}`}
          durationMs={progressDurationMs}
          state={
            phase === "processing"
              ? "running"
              : phase === "results" || phase === "clearing"
                ? "complete"
                : "idle"
          }
        />

        <AnimatePresence mode="popLayout">
          {phase === "results" ? (
            <motion.div
              key={`mobile-results-${activeClip.id}`}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 44 }}
              data-home-hero-clips
              className="mt-4 grid grid-cols-2 gap-2"
            >
              {visibleCards.map(({ clip, offset }) => (
                <HeroClipCard
                  key={`mobile-${activeClip.id}-${clip.id}-${offset}`}
                  clip={clip}
                  offset={offset}
                  featured={offset === 0}
                  mobile
                  playVideo={offset === 0 && isDemoPlaying && isMobile}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="mobile-source-note"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex h-20 items-center justify-center rounded-2xl border border-black/10 bg-white/45 px-4 text-center text-xs font-semibold text-black/50 dark:border-white/10 dark:bg-white/5 dark:text-white/45"
            >
              {phase === "source"
                ? "Clip gốc đang chạy. StudyLoop chờ thao tác tạo highlight."
                : "AI đang tách các đoạn học nhanh từ clip gốc..."}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute inset-0 hidden justify-center px-4 pb-7 pt-16 sm:flex md:px-6 md:pb-8 xl:px-5">
        <div className="relative h-full w-full max-w-[940px]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={`main-${displayClip.id}`}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{
                opacity: 1,
                y: isOutputPhase ? -24 : 0,
                scale: isOutputPhase ? 0.88 : 1,
              }}
              exit={{ opacity: 0, y: -14, scale: 0.985 }}
              transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-0 z-10 aspect-video w-[68%] max-w-[470px] -translate-x-1/2 overflow-hidden rounded-[22px] border border-black/10 bg-black shadow-[0_24px_56px_rgba(0,0,0,0.38)] dark:border-white/15 md:w-[62%] md:max-w-[500px] lg:w-[56%] xl:w-[66%] xl:max-w-[520px]"
            >
              <HeroMedia
                clip={displayClip}
                sizes="470px"
                playVideo={isDemoPlaying && !isMobile}
                priority={activeIndex === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-primary sm:text-xs">
                  Clip gốc
                </p>
                <p className="line-clamp-1 text-xs font-black sm:text-base">
                  {displayClip.title}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {phase === "results" ? (
              <motion.div
                key={`cards-${activeClip.id}`}
                initial={{ opacity: 0, y: 40, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: 120,
                  scale: 0.9,
                  filter: "blur(8px) brightness(0.9)",
                }}
                transition={{
                  duration: 0.62,
                  ease: [0.22, 1, 0.36, 1],
                  staggerChildren: 0.05,
                }}
                data-home-hero-clips
                className="absolute bottom-8 left-1/2 z-30 flex -translate-x-1/2 items-end justify-center gap-2 md:bottom-10 xl:bottom-8 xl:gap-3"
              >
                {visibleCards.map(({ clip, offset }) => (
                  <HeroClipCard
                    key={`${activeClip.id}-${clip.id}-${offset}`}
                    clip={clip}
                    offset={offset}
                    featured={offset === 0}
                    playVideo={Math.abs(offset) <= 1 && isDemoPlaying && !isMobile}
                  />
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div
            className="absolute left-1/2 z-40 w-[78%] max-w-[640px] -translate-x-1/2 -translate-y-1/2 md:w-[74%] lg:w-[70%] xl:w-[76%] xl:max-w-[620px]"
            style={{ top: isOutputPhase ? "45%" : "49%" }}
          >
            <HeroAnalysisBar phase={phase} />
            <HeroProgress
              activeKey={`generation-${activeClip.id}`}
              durationMs={progressDurationMs}
              state={
                phase === "processing"
                  ? "running"
                  : phase === "results" || phase === "clearing"
                    ? "complete"
                    : "idle"
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroMedia({
  clip,
  sizes,
  priority = false,
  playVideo = false,
}: {
  clip: HeroShowcaseClip;
  sizes: string;
  priority?: boolean;
  playVideo?: boolean;
}) {
  if (clip.videoUrl && playVideo) {
    return (
      <AutoPlayingVideo
        src={clip.videoUrl}
        poster={clip.thumbnail}
        title={clip.title}
        shouldPlay={playVideo}
      />
    );
  }

  if (clip.thumbnail) {
    return (
      <Image
        src={clip.thumbnail}
        alt={clip.title}
        fill
        priority={priority}
        className="object-cover"
        sizes={sizes}
      />
    );
  }

  if (clip.videoUrl) {
    return (
      <video
        src={clip.videoUrl}
        aria-label={clip.title}
        className="h-full w-full object-cover"
        muted
        playsInline
        preload="none"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_28%,rgba(255,152,0,0.55),transparent_30%),linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,152,0,0.26))]">
      <Video className="h-12 w-12 text-white/80" />
    </div>
  );
}

function AutoPlayingVideo({
  src,
  poster,
  title,
  shouldPlay,
}: {
  src: string;
  poster: string | null;
  title: string;
  shouldPlay: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldPlay) {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [shouldPlay, src]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster ?? undefined}
      aria-label={title}
      className="h-full w-full object-cover"
      autoPlay={shouldPlay}
      muted
      loop
      playsInline
      preload="metadata"
    />
  );
}

function HeroAnalysisBar({
  compact = false,
  phase,
}: {
  compact?: boolean;
  phase: "source" | "click" | "processing" | "results" | "clearing";
}) {
  return (
    <div
      className={`${compact ? "mt-3 grid grid-cols-[minmax(0,1fr)_auto] rounded-2xl" : "mx-auto flex h-10 w-full rounded-full md:h-11"} relative gap-1 border border-black/15 bg-white/88 p-1 text-[#252928] shadow-[0_10px_24px_rgba(45,38,25,0.14)] backdrop-blur-xl dark:border-white/20 dark:bg-[#353b3d]/92 dark:text-white dark:shadow-[0_14px_32px_rgba(0,0,0,0.42)]`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 sm:px-3 sm:py-0">
        <BookOpenCheck className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} shrink-0 text-primary`} />
        <span className={`${compact ? "text-[11px]" : "text-xs sm:text-sm"} truncate font-semibold text-black/65 dark:text-white/75`}>
          {phase === "source"
            ? "Dán link clip gốc"
            : phase === "click" || phase === "processing"
              ? "AI đang phân tích clip"
              : phase === "results"
                ? "Highlight đã sẵn sàng"
                : "Chuyển sang clip mới"}
        </span>
      </div>
      <motion.span
        animate={
          phase === "click"
            ? {
                scale: [1, 0.92, 1],
                boxShadow: "0 0 0 8px rgba(255,152,0,0.16)",
              }
            : {
                scale: 1,
                boxShadow: "0 0 0 0 rgba(255,152,0,0)",
              }
        }
        transition={{ duration: 0.52, delay: phase === "click" ? 0.28 : 0 }}
        className={`${compact ? "h-9 rounded-xl px-3 text-xs" : "h-full rounded-full px-3 text-xs md:px-4"} flex shrink-0 items-center justify-center bg-primary font-black text-primary-foreground shadow-lg shadow-primary/25`}
      >
        {phase === "results" || phase === "clearing" ? "Đã tạo" : "Tạo highlight"}
        <Video className={`${compact ? "ml-1.5 h-3.5 w-3.5" : "ml-2 h-4 w-4"}`} />
      </motion.span>
      <AnimatePresence>
        {phase === "click" ? (
          <motion.div
            initial={{
              opacity: 0,
              x: compact ? -62 : -122,
              y: compact ? -34 : 38,
              scale: 0.8,
            }}
            animate={{ opacity: 1, x: 0, y: 0, scale: [0.8, 1, 0.9] }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={`${compact ? "bottom-2 right-[28%]" : "-bottom-1 right-8"} pointer-events-none absolute z-50 text-foreground drop-shadow-[0_3px_3px_rgba(0,0,0,0.35)] dark:text-white`}
            aria-hidden="true"
          >
            <MousePointer2 className="h-7 w-7 fill-white text-black dark:fill-black dark:text-white" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function HeroProgress({
  activeKey,
  durationMs,
  state,
}: {
  activeKey: string;
  durationMs: number;
  state: "idle" | "running" | "complete";
}) {
  return (
    <div
      data-home-hero-progress={state}
      className="mx-auto mt-2 h-1 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15"
    >
      {state === "running" ? (
        <motion.div
          key={activeKey}
          className="h-full origin-left rounded-full bg-primary"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: durationMs / 1000, ease: "linear" }}
        />
      ) : state === "complete" ? (
        <div className="h-full rounded-full bg-primary" />
      ) : null}
    </div>
  );
}

function HeroClipCard({
  clip,
  offset,
  featured,
  mobile = false,
  playVideo = false,
}: {
  clip: HeroShowcaseClip;
  offset: number;
  featured: boolean;
  mobile?: boolean;
  playVideo?: boolean;
}) {
  const distance = Math.abs(offset);
  const outputs = [
    { label: "Ý chính", icon: BookOpenCheck },
    { label: "Quiz", icon: Brain },
    { label: "Feed", icon: MessageCircle },
  ];
  const OutputIcon = outputs[(offset + outputs.length * 8) % outputs.length].icon;
  const rotate = mobile ? 0 : offset * 1.3;
  const xOffset = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 35, scale: 0.8 }}
      animate={{
        opacity: mobile ? 1 : featured ? 1 : 0.7,
        y: mobile ? 0 : featured ? -8 : 6,
        x: xOffset,
        rotate,
        scale: mobile ? 1 : featured ? 1.02 : distance === 1 ? 0.94 : 0.9,
        filter:
          featured || mobile
            ? "brightness(1) saturate(1)"
            : "brightness(0.86) saturate(0.9)",
      }}
      transition={{
        duration: 0.6,
        delay: (offset + 2) * 0.035,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{ zIndex: featured ? 40 : 30 - distance }}
      className={`${mobile ? "h-[118px] w-full" : "h-[126px] w-[114px] md:h-[138px] md:w-[124px] lg:h-[144px] lg:w-[130px] xl:h-[160px] xl:w-[144px]"} relative shrink-0 overflow-hidden rounded-[16px] text-left sm:rounded-[18px]`}
    >
      <div className={`h-full overflow-hidden rounded-[16px] border bg-neutral-800 shadow-[0_14px_28px_rgba(0,0,0,0.28)] sm:rounded-[18px] ${featured ? "border-primary ring-2 ring-primary/45" : "border-black/15 dark:border-white/15"}`}>
        <div className="relative h-full w-full">
          <HeroMedia
            clip={clip}
            sizes={mobile ? "50vw" : "164px"}
            playVideo={playVideo}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-transparent" />
          <span className={`absolute left-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border text-primary shadow-md ${featured ? "border-primary bg-primary text-primary-foreground" : "border-white/20 bg-black/45 text-primary"}`}>
            <OutputIcon className="h-3 w-3" />
          </span>
          <p className={`absolute bottom-2.5 left-2.5 right-2.5 z-10 overflow-hidden text-[11px] font-bold leading-[1.16] text-white md:bottom-3 md:left-3 md:right-3 md:text-xs ${featured ? "line-clamp-2" : "line-clamp-1"}`}>
            {clip.title}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function HeroBackgroundEffects() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_35%,rgba(245,163,35,0.22),transparent_35%),radial-gradient(circle_at_76%_42%,rgba(30,126,116,0.16),transparent_40%),linear-gradient(115deg,#f1eee7,#f8f6f0_52%,#e7f0eb)] dark:bg-[radial-gradient(circle_at_24%_35%,rgba(255,152,0,0.18),transparent_35%),radial-gradient(circle_at_76%_42%,rgba(16,185,129,0.18),transparent_40%),linear-gradient(115deg,#12191d,#202426_52%,#151719)]" />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(20,30,28,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(20,30,28,0.035)_1px,transparent_1px)] [background-size:34px_34px] dark:opacity-20 dark:[background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/30 to-transparent dark:from-black/25" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/5 to-transparent dark:from-black/25" />
    </>
  );
}

function HeroMotionScene({
  items,
}: {
  items: NewsfeedItem[];
}) {
  return <CalmHeroPreview items={items} />;
}

function lecturerName(item: NewsfeedItem) {
  const fullName = [item.lecturer?.firstName, item.lecturer?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || "Giảng viên";
}

function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  icon,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        <div className="mb-1.5 flex items-center gap-2">
          {icon ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </span>
          ) : null}
          <p className="text-xs font-bold uppercase tracking-wide text-primary">
            {eyebrow}
          </p>
        </div>
        <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/* function ContinueWatchingCard({ item }: { item: ContinueWatchingLesson }) {
  return (
    <Link
      href={`/courses/${item.courseId}/learn?lessonId=${item.lessonId}`}
      className="group grid gap-3 rounded-lg border border-border/70 bg-card p-3 transition hover:border-primary/40 hover:shadow-md sm:grid-cols-[9rem_1fr]"
    >
      <div className="relative aspect-video overflow-hidden rounded-md bg-muted sm:aspect-[4/3]">
        {item.thumbnailUrl ? (
          <Image
            src={item.thumbnailUrl}
            alt={item.courseTitle}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="160px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 via-background to-emerald-500/10">
            <FaBookOpen className="h-8 w-8 text-primary/50" />
          </div>
        )}
      </div>
      <div className="min-w-0 space-y-2">
        <p className="line-clamp-1 text-xs font-bold text-primary">
          {item.courseTitle}
        </p>
        <h3 className="line-clamp-2 text-sm font-black leading-snug">
          {item.lessonTitle}
        </h3>
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>{Math.round(item.percentage)}% hoàn thành</span>
          <span>{formatPosition(item.lastVideoPositionMs)}</span>
        </div>
        <Progress value={Math.min(100, Math.max(0, item.percentage))} />
      </div>
    </Link>
  );
} */

function TrendingFeedCard({
  item,
  variant = "feature",
}: {
  item: NewsfeedItem;
  variant?: "feature" | "compact";
}) {
  if (variant === "compact") {
    return (
      <Link
        href={`/newsfeed?videoId=${item.feedId}`}
        className="group flex gap-3 rounded-lg border border-border/70 bg-card p-2.5 transition hover:border-primary/40 hover:shadow-sm"
      >
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md bg-muted">
          {item.thumbnail ? (
            <Image
              src={item.thumbnail}
              alt={item.title}
              fill
              className="object-cover transition duration-500 group-hover:scale-105"
              sizes="112px"
            />
          ) : (
            <video
              src={item.videoUrl}
              className="h-full w-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          )}
        </div>
        <div className="min-w-0 py-1">
          <h3 className="line-clamp-2 text-sm font-black leading-snug">
            {item.title}
          </h3>
          <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
            {lecturerName(item)} · {item.course.name}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/newsfeed?videoId=${item.feedId}`}
      className="group overflow-hidden rounded-xl border border-border/70 bg-card transition hover:border-primary/40 hover:shadow-lg"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {item.thumbnail ? (
          <Image
            src={item.thumbnail}
            alt={item.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 640px"
          />
        ) : (
          <video
            src={item.videoUrl}
            className="h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-xl font-black leading-tight">
          {item.title}
        </h3>
        <p className="mt-3 line-clamp-1 text-sm text-muted-foreground">
          {lecturerName(item)} · {item.course.name}
        </p>
      </div>
    </Link>
  );
}

function HighlightShowcase({
  uploadHref,
  newsfeedHref,
}: {
  uploadHref: string;
  newsfeedHref: string;
}) {
  return (
    <section className="border-b border-border/70 bg-gradient-to-b from-muted/25 to-background py-10 md:py-12 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center xl:min-h-[calc(100svh-4rem)]">
      <div className="mx-auto w-full max-w-[96rem] px-4 sm:px-6 lg:px-8">
        <div className="mb-5 md:mb-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Video className="h-3.5 w-3.5" />
              </span>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                Luồng highlight
              </p>
            </div>
            <h2 className="max-w-5xl text-2xl font-black tracking-tight sm:text-4xl">
              Từ clip gốc sang highlight học nhanh.
            </h2>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-xl shadow-primary/10 md:p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch lg:gap-5">
            <div className="overflow-hidden rounded-xl border border-border/70 bg-background">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Clip gốc
                  </p>
                  <h3 className="mt-1 line-clamp-1 text-base font-black">
                    {demoCases[0].longTitle}
                  </h3>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                  {demoCases[0].longDuration}
                </span>
              </div>
              <div className="relative aspect-video bg-muted">
                <video
                  src={demoCases[0].longVideo}
                  poster={demoCases[0].longThumbnail}
                  className="h-full w-full object-cover"
                  preload="metadata"
                  playsInline
                  controls
                />
              </div>
            </div>

            <div className="hidden items-center justify-center md:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-sm lg:h-12 lg:w-12">
                <ArrowRight className="h-4 w-4 lg:h-5 lg:w-5" />
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-primary/30 bg-background">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">
                    Clip highlight
                  </p>
                  <h3 className="mt-1 line-clamp-1 text-base font-black">
                    {demoCases[0].shortTitle}
                  </h3>
                </div>
                <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-black text-primary-foreground">
                  {demoCases[0].shortDuration}
                </span>
              </div>
              <div className="relative aspect-video bg-muted">
                <video
                  src={demoCases[0].shortVideo}
                  poster={demoCases[0].shortThumbnail}
                  className="h-full w-full object-cover"
                  preload="metadata"
                  playsInline
                  controls
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-center">
            <div className="grid gap-2 sm:grid-cols-3 md:col-span-2">
              {studioWorkflowSteps.slice(1).map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background px-3 py-2.5"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-sm font-black">{step.title}</p>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
              <Button asChild className="rounded-xl font-black">
                <Link href={uploadHref}>
                  Tạo highlight
                  <Video className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="rounded-xl border-border/70 bg-background font-black text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-foreground dark:bg-card dark:hover:bg-primary/15"
              >
                <Link href={newsfeedHref}>
                  Xem feed
                  <Play className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const { isAuthenticated } = useAuthState();
  const uploadHref = isAuthenticated ? "/upload" : "/signin?returnUrl=%2Fupload";

  const popularCoursesQuery = useHomePopularCourses();
  const trendingFeedQuery = useHomeTrendingFeed();
  const trendingHashtagsQuery = useHomeTrendingHashtags();

  const newsfeedHref = `/newsfeed?videoId=${demoCases[0].videoId}`;

  const popularCourses = popularCoursesQuery.data ?? [];
  const trendingFeed = trendingFeedQuery.data?.items ?? [];
  const trendingHashtags = trendingHashtagsQuery.data?.items ?? [];

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
        newsfeedHref={newsfeedHref}
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

          {trendingFeed.length > 0 ? (
            <>
              {trendingHashtags.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {trendingHashtags.map((item) => (
                    <Link
                      key={item.tag}
                      href={`/newsfeed/search?q=${encodeURIComponent(`#${item.tag}`)}`}
                      className="rounded-full border border-border/70 px-3 py-1.5 text-xs font-bold text-foreground transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/15"
                    >
                      #{item.tag}
                    </Link>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
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
            <motion.div
              className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pb-0 lg:grid-cols-4 xl:gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
            >
              {popularCourses.slice(0, 4).map((course) => (
                <div key={course.id} className="w-[280px] shrink-0 sm:w-auto">
                  <CourseCard course={course} />
                </div>
              ))}
            </motion.div>
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
