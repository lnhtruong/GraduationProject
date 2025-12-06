"use client";

import { useSearchParams } from "next/navigation";
import VideoPreview from "./VideoPreview";
import EditorToolbar from "./EditorToolbar";
import { Suspense } from "react";

export default function EditorClient() {
  const searchParams = useSearchParams();
  const src = searchParams.get("src");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Video Preview */}
      <div className="lg:col-span-2">
        <Suspense fallback={<div>Loading video...</div>}>
          <VideoPreview src={src || undefined} />
        </Suspense>
      </div>

      {/* Editor Tools */}
      <div className="space-y-4">
        <EditorToolbar
          onCut={() => console.log("Cut action")}
          onVolumeChange={(volume) => console.log("Volume:", volume)}
          onBrightnessChange={(brightness) =>
            console.log("Brightness:", brightness)
          }
          onExport={() => console.log("Export action")}
        />
      </div>
    </div>
  );
}
