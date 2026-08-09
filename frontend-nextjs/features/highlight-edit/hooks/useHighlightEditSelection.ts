"use client";

import * as React from "react";
import { fetchAndParseSrt } from "@/features/upload/utils/srt.utils";
import type { SubtitleLine, SegmentRangePayload } from "@/features/upload/types";

export interface DisplayTimeRange {
  start: number;
  end: number;
}

export interface UseHighlightEditSelectionReturn {
  lines: SubtitleLine[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  /** Each line's position on the highlight's OWN (rendered) timeline, not
   * `line.startSec`/`endSec` — those are the SOURCE video's timestamps
   * (preserved as-is in the SRT, see research.md). Segments are concatenated
   * back-to-back in the same order they appear here (chronological by
   * source time), so this is just each line's own duration stacked after
   * the running total of everything before it. Keyed by `line.index`. */
  displayTimes: Map<number, DisplayTimeRange>;
  isMarked: (index: number) => boolean;
  toggleMark: (index: number) => void;
  /** Bulk-apply (or clear) the removal mark to a set of indices — used by the multi-select toolbar. */
  setManyMarks: (indices: number[], marked: boolean | null) => void;
  markedCount: number;
  /** false once every currently-loaded line has been marked for removal (FR-004 client guard). */
  hasRemainingSegment: boolean;
  toPayloadRanges: () => SegmentRangePayload[];
}

function collapseToRanges(indices: number[]): SegmentRangePayload[] {
  const sorted = [...indices].sort((a, b) => a - b);
  const ranges: SegmentRangePayload[] = [];
  for (const index of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && index === last.end_index + 1) {
      last.end_index = index;
    } else {
      ranges.push({ start_index: index, end_index: index });
    }
  }
  return ranges;
}

/**
 * Fetches a highlight's CURRENT srt_raw_url (freshly, on every call — never a
 * stale/cached copy, which is what makes repeated editing (US2) correct) and
 * tracks a single "marked for removal" boolean per line. v1 has no keep/add
 * states — every line starts implicitly included; the only action is marking
 * it for removal.
 */
export function useHighlightEditSelection(
  srtUrl: string | null,
): UseHighlightEditSelectionReturn {
  const [lines, setLines] = React.useState<SubtitleLine[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [marked, setMarked] = React.useState<Set<number>>(() => new Set());
  const [fetchToken, setFetchToken] = React.useState(0);

  React.useEffect(() => {
    if (!srtUrl) {
      setLines([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setMarked(new Set());
    fetchAndParseSrt(srtUrl)
      .then((parsed) => {
        if (!cancelled) setLines(parsed);
      })
      .catch(() => {
        if (!cancelled) setError("Không thể tải danh sách đoạn hiện tại.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [srtUrl, fetchToken]);

  const refetch = React.useCallback(() => setFetchToken((t) => t + 1), []);

  const displayTimes = React.useMemo(() => {
    const map = new Map<number, DisplayTimeRange>();
    let cursor = 0;
    for (const line of lines) {
      const duration = Math.max(0, line.endSec - line.startSec);
      map.set(line.index, { start: cursor, end: cursor + duration });
      cursor += duration;
    }
    return map;
  }, [lines]);

  const isMarked = React.useCallback(
    (index: number) => marked.has(index),
    [marked],
  );

  const toggleMark = React.useCallback((index: number) => {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const setManyMarks = React.useCallback(
    (indices: number[], mark: boolean | null) => {
      setMarked((prev) => {
        const next = new Set(prev);
        for (const index of indices) {
          if (mark === true) next.add(index);
          else next.delete(index);
        }
        return next;
      });
    },
    [],
  );

  const toPayloadRanges = React.useCallback(
    () => collapseToRanges([...marked]),
    [marked],
  );

  return {
    lines,
    isLoading,
    error,
    refetch,
    displayTimes,
    isMarked,
    toggleMark,
    setManyMarks,
    markedCount: marked.size,
    hasRemainingSegment: lines.length === 0 || marked.size < lines.length,
    toPayloadRanges,
  };
}
