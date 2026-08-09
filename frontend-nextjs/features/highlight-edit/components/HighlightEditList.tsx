"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import HighlightEditRow from "./HighlightEditRow";
import type { SubtitleLine } from "@/features/upload/types";
import type {
  DisplayTimeRange,
  UseHighlightEditSelectionReturn,
} from "../hooks/useHighlightEditSelection";

interface HighlightEditListProps {
  lines: SubtitleLine[];
  displayTimes: Map<number, DisplayTimeRange>;
  selection: Pick<
    UseHighlightEditSelectionReturn,
    "isMarked" | "toggleMark" | "setManyMarks"
  >;
}

/** Search + click/shift-click/drag multi-select + bulk toolbar, mirroring
 * SubtitleLineList.tsx (feature 002) — v1 only has one mark type ("loại bỏ"),
 * so the bulk toolbar has just that action plus "Bỏ chọn". */
export default function HighlightEditList({
  lines,
  displayTimes,
  selection,
}: HighlightEditListProps) {
  const [query, setQuery] = React.useState("");
  const [highlighted, setHighlighted] = React.useState<Set<number>>(
    () => new Set(),
  );
  const anchorRef = React.useRef<number | null>(null);
  const draggingRef = React.useRef(false);

  const filteredLines = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter((line) => line.text.toLowerCase().includes(q));
  }, [lines, query]);

  const selectRange = React.useCallback(
    (fromIndex: number, toIndex: number) => {
      const lo = Math.min(fromIndex, toIndex);
      const hi = Math.max(fromIndex, toIndex);
      const next = new Set<number>();
      for (const line of lines) {
        if (line.index >= lo && line.index <= hi) next.add(line.index);
      }
      setHighlighted(next);
    },
    [lines],
  );

  const handleMouseDown = (line: SubtitleLine, event: React.MouseEvent) => {
    if (event.shiftKey && anchorRef.current != null) {
      selectRange(anchorRef.current, line.index);
      return;
    }
    anchorRef.current = line.index;
    draggingRef.current = true;
    setHighlighted(new Set([line.index]));
  };

  const handleMouseEnter = (line: SubtitleLine) => {
    if (!draggingRef.current || anchorRef.current == null) return;
    selectRange(anchorRef.current, line.index);
  };

  React.useEffect(() => {
    const stopDragging = () => {
      draggingRef.current = false;
    };
    window.addEventListener("mouseup", stopDragging);
    return () => window.removeEventListener("mouseup", stopDragging);
  }, []);

  const clearHighlight = () => {
    setHighlighted(new Set());
    anchorRef.current = null;
  };

  const applyBulk = (mark: boolean | null) => {
    selection.setManyMarks([...highlighted], mark);
    clearHighlight();
  };

  const hasHighlight = highlighted.size > 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm theo từ khóa trong phụ đề..."
          className="pl-8"
        />
      </div>

      {hasHighlight && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <span>{highlighted.size} dòng đang chọn</span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => applyBulk(true)}
            >
              Đánh dấu loại bỏ
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => applyBulk(null)}
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {filteredLines.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Không tìm thấy dòng phụ đề nào khớp.
          </p>
        ) : (
          filteredLines.map((line) => {
            const display = displayTimes.get(line.index) ?? {
              start: line.startSec,
              end: line.endSec,
            };
            return (
              <HighlightEditRow
                key={line.index}
                line={line}
                displayStart={display.start}
                displayEnd={display.end}
                isMarked={selection.isMarked(line.index)}
                onToggle={() => selection.toggleMark(line.index)}
                isHighlighted={highlighted.has(line.index)}
                onMouseDown={(event) => handleMouseDown(line, event)}
                onMouseEnter={() => handleMouseEnter(line)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
