"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Brain, Play, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { highlightShowcase, type HighlightShowcaseItem } from "@/features/home/data/highlightShowcase";
export function HighlightShowcase({ uploadHref }: { uploadHref: string }) {
  const [selectedHighlightIndex, setSelectedHighlightIndex] = useState(0);
  const selectedHighlight = highlightShowcase.highlights[selectedHighlightIndex];
  const newsfeedHref = `/newsfeed?feedId=${selectedHighlight.feedId}`;
  const topicCount = highlightShowcase.highlights.length;

  return (
    <section className="border-b border-border/70 bg-gradient-to-b from-muted/25 to-background py-10 md:py-12 lg:flex lg:min-h-[calc(100svh-4rem)] lg:items-center xl:min-h-[calc(100svh-4rem)]">
      <div className="mx-auto w-full max-w-[96rem] px-4 sm:px-6 lg:px-8">
        <div className="mb-5 md:mb-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Video className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary sm:text-xs">Video gốc → Bộ video highlight</p>
            </div>
            <h2 className="max-w-5xl text-2xl font-black tracking-tight sm:text-4xl">
              Một video dài, nhiều highlight theo từng chủ đề.
            </h2>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-3 shadow-xl shadow-primary/10 md:p-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,4fr)_minmax(7rem,1.3fr)_minmax(0,4.5fr)] xl:items-stretch xl:gap-3">
            <div className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-background xl:self-center">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/70 px-3 py-3 sm:px-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    01 video gốc
                  </p>
                  <h3 className="mt-1 line-clamp-1 text-sm font-black">
                    {highlightShowcase.source.title}
                  </h3>
                </div>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-black text-primary">
                  {highlightShowcase.source.duration}
                </span>
              </div>
              <div className="relative aspect-video bg-muted">
                <video
                  src={highlightShowcase.source.video}
                  poster={highlightShowcase.source.thumbnail}
                  className="h-full w-full object-cover"
                  preload="metadata"
                  playsInline
                  muted
                  controls
                />
              </div>
            </div>

            <BranchConnector activeIndex={selectedHighlightIndex} />

            <div className="overflow-hidden rounded-xl border border-primary/30 bg-background xl:self-stretch">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/70 px-3 py-3 sm:px-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-primary sm:text-xs">
                    Bộ video đa chủ đề
                  </p>
                  <h3 className="mt-1 text-sm font-black sm:text-base">
                    <span className="sm:hidden">AI tìm chủ đề</span>
                    <span className="hidden sm:inline">AI tự tìm các chủ đề từ video gốc</span>
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    <span className="sm:hidden">Tách thành các highlight riêng.</span>
                    <span className="hidden sm:inline">Mỗi chủ đề được tách thành một highlight riêng để xem ngay.</span>
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-black text-primary-foreground sm:text-xs">
                  {topicCount} highlight
                </span>
              </div>
              <div className="grid gap-2.5 p-3">
                {highlightShowcase.highlights.map((item, index) => (
                  <HighlightBranchCard
                    key={item.id}
                    item={item}
                    index={index}
                    isSelected={index === selectedHighlightIndex}
                    onSelect={() => setSelectedHighlightIndex(index)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button asChild className="w-full rounded-xl font-black sm:w-auto">
              <Link href={uploadHref}>
                Tạo bộ highlight
                <Video className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full rounded-xl border-border/70 bg-background font-black text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-foreground dark:bg-card dark:hover:bg-primary/15 sm:w-auto"
            >
              <Link href={newsfeedHref}>
                Xem highlight trên feed
                <Play className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function BranchConnector({ activeIndex }: { activeIndex: number }) {
  const branches = [
    { top: 17, dotClass: "top-[17%]", bend: -15 },
    { top: 50, dotClass: "top-1/2", bend: 0 },
    { top: 83, dotClass: "top-[83%]", bend: 15 },
  ];

  return (
    <>
      <div className="relative flex h-14 items-center justify-center xl:hidden">
        <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-primary/30" />
        <div className="relative z-10 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-4 py-2 text-xs font-black uppercase text-primary shadow-sm shadow-primary/10">
          <Brain className="h-4 w-4 shrink-0" />
          <span>AI tìm kiếm chủ đề</span>
        </div>
        <span className="absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary" />
      </div>

      <div className="hidden items-stretch justify-center pt-[5.15rem] xl:flex xl:self-stretch">
        <div className="relative h-full min-h-[18rem] w-full">
          <span className="absolute left-0 top-1/2 h-px w-[31%] -translate-y-1/2 bg-primary/35" />
          <svg
            className="absolute inset-y-0 right-0 h-full w-[69%] overflow-visible"
            viewBox="0 0 120 100"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {branches.map((branch, index) => {
              const isActive = activeIndex === index;

              return (
                <path
                  key={branch.top}
                  d={`M0 50 C34 50 42 ${50 + branch.bend} 68 ${branch.top} C84 ${branch.top} 98 ${branch.top} 120 ${branch.top}`}
                  className={isActive ? "stroke-primary transition-all duration-200" : "stroke-primary/28 transition-all duration-200"}
                  strokeWidth={isActive ? "2.2" : "1.5"}
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
          {branches.map((branch, index) => {
            const isActive = activeIndex === index;

            return (
              <span
                key={branch.top}
                className={`absolute right-0 ${branch.dotClass} z-20 h-2.5 w-2.5 -translate-y-1/2 rounded-full border transition-colors duration-200 ${isActive ? "border-primary bg-primary" : "border-primary/45 bg-background"}`}
              />
            );
          })}
          <div className="absolute left-[31%] top-1/2 z-30 flex w-[6.25rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-background px-2 py-2 text-center text-[10px] font-black uppercase leading-4 text-primary shadow-md shadow-primary/10">
            <Brain className="h-3.5 w-3.5 shrink-0" />
            <span>AI tìm kiếm<br />chủ đề</span>
          </div>
        </div>
      </div>
    </>
  );
}

function HighlightBranchCard({
  item,
  index,
  isSelected,
  onSelect,
}: {
  item: HighlightShowcaseItem;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const paddedIndex = String(index + 1).padStart(2, "0");
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePreview = () => {
    onSelect();
    window.setTimeout(() => {
      void videoRef.current?.play().catch(() => undefined);
    }, 0);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`group relative grid min-w-0 cursor-pointer grid-cols-1 overflow-hidden rounded-xl border text-left transition-all duration-300 sm:grid-cols-[minmax(10rem,15rem)_1fr] xl:grid-cols-[minmax(9rem,12rem)_1fr] 2xl:grid-cols-[minmax(10rem,14rem)_1fr] ${isSelected ? "border-primary bg-primary/8 shadow-sm shadow-primary/10" : "border-border/70 bg-muted/30 hover:border-primary/45 hover:bg-primary/5"}`}
    >
      <div className="relative order-2 aspect-video overflow-hidden bg-muted sm:order-1 sm:h-full sm:min-h-full">
        <video
          ref={videoRef}
          key={item.id}
          src={item.video}
          poster={item.thumbnail}
          className="h-full w-full object-cover"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          preload="metadata"
          playsInline
          muted
          controls={isSelected}
        />
        {!isSelected ? (
          <button
            type="button"
            aria-label={`Xem thử ${item.title} tại Home`}
            onClick={(event) => {
              event.stopPropagation();
              handlePreview();
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/65 text-white shadow transition hover:bg-black/75 sm:h-9 sm:w-9">
              <Play className="h-3 w-3 fill-current sm:h-4 sm:w-4" />
            </span>
          </button>
        ) : null}
        <span className="pointer-events-none absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/75 text-[11px] font-black text-white shadow-sm sm:left-2 sm:top-2 sm:h-7 sm:w-7 sm:text-xs">
          {paddedIndex}
        </span>
      </div>
      <div className="order-1 min-w-0 px-3 py-3 sm:order-2 sm:px-3 sm:py-3">
        <p className="break-words text-[10px] font-bold uppercase leading-4 tracking-wide text-primary sm:text-[11px]">
          {paddedIndex} · {item.label} · {item.duration}
        </p>
        <h4 className="mt-0.5 line-clamp-2 text-sm font-black leading-4 sm:mt-1 sm:text-base sm:leading-5">
          {item.title}
        </h4>
        <Link
          href={`/newsfeed?feedId=${item.feedId}`}
          onClick={(event) => event.stopPropagation()}
          className={`mt-1.5 h-6 items-center rounded-lg bg-primary px-2 text-[10px] font-black text-primary-foreground transition hover:bg-primary/90 sm:mt-2 sm:h-7 sm:px-2.5 sm:text-[11px] ${isSelected ? "inline-flex" : "hidden"}`}
        >
          Xem trên feed
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
