"use client";

import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  Compass,
  GraduationCap,
  Loader2,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AppEmptyState } from "@/features/_shared/components/AppEmptyState";
import { AppLoadingState } from "@/features/_shared/components/AppLoadingState";
import { AppPageHeader } from "@/features/_shared/components/AppPageHeader";
import { useMyCourses } from "../api/my-courses.api";
import { EnrolledCourseCard } from "./EnrolledCourseCard";

function HeaderStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card className="rounded-lg border-border/70 bg-muted/20 py-0">
      <CardContent className="p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-background text-primary">
          {icon}
        </div>
        <div>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      </CardContent>
    </Card>
  );
}

export function MyCoursesPage() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyCourses();

  const pages = data?.pages || [];
  const allEnrollments = pages.flatMap((page) => page.data || []);
  const isEmpty = allEnrollments.length === 0;
  const totalCourses = allEnrollments.length;
  const completedCourses = allEnrollments.filter(
    (enrollment) =>
      enrollment.status === "completed" || enrollment.progress >= 100,
  ).length;
  const inProgressCourses = totalCourses - completedCourses;

  if (isError) {
    return (
      <div className="min-h-screen bg-background">
        <AppPageHeader
          eyebrow="Học tập"
          title="Học tập của tôi"
          description="Không thể tải danh sách khóa học lúc này."
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <div className="container mx-auto max-w-7xl px-4 py-8 text-center lg:px-8">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              Đã xảy ra lỗi khi tải danh sách khóa học.
            </AlertDescription>
          </Alert>
            <Button onClick={() => window.location.reload()} variant="outline">
              Thử lại
            </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <AppPageHeader
        eyebrow="Học tập"
        title="Học tập của tôi"
        description="Theo dõi tiến độ và tiếp tục các khóa học bạn đang tham gia."
        icon={<GraduationCap className="h-5 w-5" />}
        stats={
          !isLoading && !isEmpty ? (
            <>
              <HeaderStat
                icon={<BookOpen className="h-4 w-4" />}
                label="Khóa học"
                value={totalCourses}
              />
              <HeaderStat
                icon={<Clock className="h-4 w-4" />}
                label="Đang học"
                value={inProgressCourses}
              />
              <HeaderStat
                icon={<Trophy className="h-4 w-4" />}
                label="Hoàn thành"
                value={completedCourses}
              />
            </>
          ) : null
        }
      />

      <div className="container mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {isLoading ? (
          <AppLoadingState
            variant="cards"
            count={8}
            message="Đang tải danh sách khóa học..."
          />
        ) : isEmpty ? (
          <AppEmptyState
            icon={<Compass className="h-8 w-8" />}
            title="Bạn chưa tham gia khóa học nào"
            description="Khám phá các khóa học phù hợp rồi quay lại đây để tiếp tục học và theo dõi tiến độ."
            action={
              <Button asChild>
                <Link href="/courses/search">Khám phá khóa học</Link>
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pages.map((page, index) => (
                <Fragment key={index}>
                  {page.data.map((enrollment) => (
                    <EnrolledCourseCard
                      key={enrollment.id}
                      enrollment={enrollment}
                    />
                  ))}
                </Fragment>
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-10 flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="min-w-[180px]"
                >
                  {isFetchingNextPage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
