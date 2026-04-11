import { Suspense } from "react";
import Editor from "@/features/editor";
import { PageLoader } from "@/components/PageLoader";

export default function EditorPage() {
  return (
    <Suspense fallback={<PageLoader message="Đang tải trình chỉnh sửa..." />}>
      <Editor />
    </Suspense>
  );
}
