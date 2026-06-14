"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { PageLoader } from "@/components/PageLoader";

const Editor = dynamic(() => import("@/features/editor"), {
  ssr: false,
  loading: () => <PageLoader message="Đang tải trình chỉnh sửa..." />,
});

export default function EditorPage() {
  return (
    <Suspense fallback={<PageLoader message="Đang tải trình chỉnh sửa..." />}>
      <Editor />
    </Suspense>
  );
}
