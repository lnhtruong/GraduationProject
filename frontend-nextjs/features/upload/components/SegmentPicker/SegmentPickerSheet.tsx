"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import SubtitleLineList from "./SubtitleLineList";
import KeepDurationMeter from "./KeepDurationMeter";
import type { SubtitleLine } from "../../types";
import type { UseSegmentSelectionReturn } from "../../hooks/useSegmentSelection";

export type PickerVideoState =
  | { kind: "loading" }
  | { kind: "no-transcript" }
  | { kind: "transcribing" }
  | { kind: "ready"; srtUrl: string };

interface SegmentPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoState: PickerVideoState;
  segmentSelection: UseSegmentSelectionReturn;
  targetMaxSec: number;
  /** SRT fetch/parse result — owned by HighlightParamsForm (not this Sheet)
   * so the outer form can also compute keep-duration for submit-blocking
   * (FR-011) without duplicating the fetch. */
  lines: SubtitleLine[];
  isLoadingSrt: boolean;
  srtError: string | null;
}

/**
 * Sheet shell for the segment picker — resolves which sub-view to render.
 * Receives `segmentSelection` as a prop rather than calling
 * useSegmentSelection() itself — this component's content unmounts on
 * close, and calling the hook here would reset marks every close (FR-014).
 */
export default function SegmentPickerSheet({
  open,
  onOpenChange,
  videoState,
  segmentSelection,
  targetMaxSec,
  lines,
  isLoadingSrt,
  srtError,
}: SegmentPickerSheetProps) {
  const keepDurationSec = segmentSelection.keepDurationSec(lines);

  return (
    <Sheet
      open={open && videoState.kind !== "no-transcript"}
      onOpenChange={onOpenChange}
    >
        <SheetContent
          side="right"
          className="flex w-full max-w-[600px] flex-col gap-3 sm:max-w-[600px]"
        >
          <SheetHeader className="pb-2 pr-10">
            <SheetTitle>Tinh chỉnh theo từng đoạn</SheetTitle>
            <SheetDescription>
              Chọn đoạn cần giữ hoặc bỏ qua khi tạo highlight mới.
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 pb-4">
            {videoState.kind === "loading" && (
              <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang kiểm tra phụ đề...
              </div>
            )}

            {videoState.kind === "transcribing" && (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p>Đang tạo phụ đề cho video, có thể mất vài phút.</p>
                <p>Bạn có thể đóng cửa sổ này và quay lại sau.</p>
              </div>
            )}

            {videoState.kind === "ready" && (
              <>
                {isLoadingSrt && (
                  <div className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải phụ đề...
                  </div>
                )}
                {srtError && (
                  <p className="text-sm text-destructive">{srtError}</p>
                )}
                {!isLoadingSrt && !srtError && (
                  <>
                    <KeepDurationMeter
                      keepDurationSec={keepDurationSec}
                      targetMaxSec={targetMaxSec}
                    />
                    <SubtitleLineList
                      lines={lines}
                      segmentSelection={segmentSelection}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </SheetContent>
    </Sheet>
  );
}
