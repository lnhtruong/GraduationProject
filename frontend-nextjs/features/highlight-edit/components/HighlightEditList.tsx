"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import HighlightEditRow from "./HighlightEditRow";
import type { SubtitleLine } from "@/features/upload/types";
import type {
  DisplayTimeRange,
  UseHighlightEditSelectionReturn,
} from "../hooks/useHighlightEditSelection";

interface HighlightEditListProps {
  lines: SubtitleLine[];
  displayTimes: Map<number, DisplayTimeRange>;
  selection: Pick<UseHighlightEditSelectionReturn, "isMarked" | "toggleMark">;
}

export default function HighlightEditList({
  lines,
  displayTimes,
  selection,
}: HighlightEditListProps) {
  const [query, setQuery] = React.useState("");

  const filteredLines = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter((line) => line.text.toLowerCase().includes(q));
  }, [lines, query]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="relative shrink-0">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm trong phụ đề..."
          className="h-10 rounded-lg pl-9"
        />
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1.5">
        {filteredLines.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Không tìm thấy đoạn phù hợp.
          </div>
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
              />
            );
          })
        )}
      </div>
    </div>
  );
}