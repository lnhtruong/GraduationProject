import { Suspense } from "react";
import EditorClient from "@/features/editor/EditorClient";

export default function VideoEditorPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-center text-foreground">
          Video Editor
        </h1>

        <Suspense fallback={<div>Loading editor...</div>}>
          <EditorClient />
        </Suspense>
      </div>
    </div>
  );
}
