"use client";

import { use } from "react";
import { CourseOwnerGuard } from "@/components/CourseOwnerGuard";

interface Props {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}

export default function CourseIdLayout({ children, params }: Props) {
  const { courseId } = use(params);
  return (
    <CourseOwnerGuard courseId={Number(courseId)}>
      {children}
    </CourseOwnerGuard>
  );
}
