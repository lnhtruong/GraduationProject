"use client";

import Image from "next/image";
import Link from "next/link";
import { GraduationCap, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatDuration, parseHHMMSS } from "@/features/courses/utils";
import type { EnrollRecord } from "../types";

interface EnrolledCourseCardProps {
  enroll: EnrollRecord;
  index?: number;
}

export function EnrolledCourseCard({ enroll, index = 0 }: EnrolledCourseCardProps) {
  const { course, progress, status, enrolledAt, completedAt } = enroll;
  const isCompleted = status === "completed";

  const durationSecs = parseHHMMSS(course.duration);
  const enrolledDate = new Date(enrolledAt).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const completedDate = completedAt
    ? new Date(completedAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  const progressColor =
    isCompleted
      ? "bg-emerald-500"
      : progress >= 60
        ? "bg-primary"
        : "bg-primary/70";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
      className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      {/* Thumbnail */}
      <Link
        href={`/courses/${course.id}/learn`}
        className="relative block aspect-video overflow-hidden bg-muted"
      >
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={course.name}
            fill
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10">
            <GraduationCap className="h-12 w-12 text-primary/40" />
          </div>
        )}

        {/* Completed overlay */}
        {isCompleted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50">
            <CheckCircle2 className="h-9 w-9 text-emerald-400 drop-shadow" />
            <span className="text-[11px] font-semibold text-emerald-300 tracking-wide">
              Hoàn thành
            </span>
          </div>
        )}

        {/* Play button on hover */}
        {!isCompleted && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex items-center justify-center rounded-full bg-black/50 p-3 backdrop-blur-sm">
              <PlayCircle className="h-8 w-8 text-white" />
            </div>
          </div>
        )}

        {/* Level badge */}
        {course.level && (
          <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground text-xs font-semibold">
            {course.level}
          </Badge>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <Link href={`/courses/${course.id}/learn`}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug transition-colors group-hover:text-primary">
            {course.name}
          </h3>
        </Link>

        {/* Duration */}
        {durationSecs > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDuration(durationSecs)}
          </span>
        )}

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tiến độ</span>
            <span
              className={`font-semibold ${
                isCompleted ? "text-emerald-500" : "text-foreground"
              }`}
            >
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              className={`h-full rounded-full ${progressColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, progress)}%` }}
              transition={{ duration: 0.6, delay: index * 0.05 + 0.2, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Date info */}
        <p className="text-xs text-muted-foreground">
          {isCompleted && completedDate
            ? `Hoàn thành: ${completedDate}`
            : `Đã đăng ký: ${enrolledDate}`}
        </p>

        <div className="flex-1" />

        {/* CTA */}
        <Button
          size="sm"
          variant={isCompleted ? "outline" : "default"}
          className={`w-full text-xs ${
            isCompleted
              ? "border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              : ""
          }`}
          asChild
        >
          <Link href={`/courses/${course.id}/learn`}>
            {isCompleted ? "Xem lại" : "Tiếp tục học"}
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
