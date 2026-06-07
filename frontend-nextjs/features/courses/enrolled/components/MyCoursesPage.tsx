"use client";

import { useMemo, useState } from "react";
import { BookOpen, Flame, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEnrolledCourses } from "../api/enrolled.hooks";
import { EnrolledCourseCard } from "./EnrolledCourseCard";
import type { EnrollRecord, EnrollStatusFilter } from "../types";

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="mt-1 h-8 w-full rounded-lg" />
      </div>
    </div>
  );
}

const EMPTY_STATE_CONFIG: Record<
  EnrollStatusFilter,
  { icon: React.ElementType; title: string; desc: string }
> = {
  active: {
    icon: Flame,
    title: "Không có khóa học đang học",
    desc: "Các khóa học bạn đang theo học sẽ xuất hiện ở đây.",
  },
  completed: {
    icon: Trophy,
    title: "Chưa hoàn thành khóa học nào",
    desc: "Hoàn thành khóa học đầu tiên để mở khóa thành tựu của bạn.",
  },
};

function EmptyState({ filter }: { filter: EnrollStatusFilter }) {
  const { icon: Icon, title, desc } = EMPTY_STATE_CONFIG[filter];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
        <Icon className="h-12 w-12 text-muted-foreground/40" />
      </div>
      <h2 className="mb-2 text-xl font-bold">{title}</h2>
      <p className="mb-8 max-w-sm text-sm text-muted-foreground">{desc}</p>
      <Button
        variant="outline"
        className="border-primary/40 text-primary hover:bg-primary/5"
        asChild
      >
        <Link href="/courses">Khám phá khóa học</Link>
      </Button>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-border/60 bg-card px-5 py-4">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

const TAB_LABELS: Record<EnrollStatusFilter, string> = {
  active: "Đang học",
  completed: "Đã hoàn thành",
};

const TAB_BADGE_CLASS: Record<EnrollStatusFilter, string> = {
  active: "bg-primary/10 text-primary",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

export function MyCoursesPage() {
  const [activeTab, setActiveTab] = useState<EnrollStatusFilter>("active");
  const { data, isLoading, isError } = useEnrolledCourses();

  const allItems: EnrollRecord[] = data?.data ?? [];

  const filtered = useMemo(
    () => allItems.filter((e) => e.status === activeTab),
    [allItems, activeTab],
  );

  const counts = useMemo(
    () => ({
      all: allItems.length,
      active: allItems.filter((e) => e.status === "active").length,
      completed: allItems.filter((e) => e.status === "completed").length,
    }),
    [allItems],
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Khóa học của tôi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi tiến trình học tập của bạn
        </p>
      </div>

      {/* Quick stats */}
      {!isLoading && !isError && counts.all > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 grid grid-cols-3 gap-3 sm:gap-4"
        >
          <StatCard label="Tổng khóa học" value={counts.all} color="text-foreground" />
          <StatCard label="Đang học" value={counts.active} color="text-primary" />
          <StatCard label="Hoàn thành" value={counts.completed} color="text-emerald-500" />
        </motion.div>
      )}

      {/* Error */}
      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">
            Không thể tải danh sách. Vui lòng thử lại sau.
          </p>
        </div>
      )}

      {!isError && (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as EnrollStatusFilter)}
        >
          <TabsList className="mb-6 h-auto gap-1 rounded-xl bg-muted/60 p-1">
            {(["active", "completed"] as EnrollStatusFilter[]).map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {TAB_LABELS[tab]}
                {!isLoading && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium ${TAB_BADGE_CLASS[tab]}`}
                  >
                    {counts[tab]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {(["active", "completed"] as EnrollStatusFilter[]).map((tab) => (
            <TabsContent key={tab} value={tab} forceMount className={activeTab !== tab ? "hidden" : ""}>
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  >
                    {Array.from({ length: 8 }).map((_, i) => (
                      <CardSkeleton key={i} />
                    ))}
                  </motion.div>
                ) : filtered.length === 0 ? (
                  <EmptyState key={`empty-${tab}`} filter={tab} />
                ) : (
                  <motion.div
                    key={`grid-${tab}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  >
                    {filtered.map((enroll, i) => (
                      <EnrolledCourseCard key={enroll.id} enroll={enroll} index={i} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
