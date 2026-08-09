"use client";

import * as React from "react";
import type {
  SegmentMarkState,
  SegmentRangePayload,
  SegmentSelectionState,
  SubtitleLine,
} from "../types";

export interface UseSegmentSelectionReturn {
  marks: SegmentSelectionState;
  getMark: (index: number) => SegmentMarkState | undefined;
  /** Re-marking the currently-active state returns the line to neutral (FR-003). */
  setMark: (index: number, mark: SegmentMarkState) => void;
  /** Bulk-apply one mark (or `null` to clear) to a set of indices — used by the multi-select toolbar. */
  setManyMarks: (indices: number[], mark: SegmentMarkState | null) => void;
  clearAll: () => void;
  isEmpty: boolean;
  keepCount: number;
  removeCount: number;
  /** Sum of "keep"-marked lines' duration, merging overlapping/adjacent time ranges first. */
  keepDurationSec: (lines: SubtitleLine[]) => number;
  /** Collapses index->mark into contiguous {start_index,end_index} ranges for the API payload. */
  toPayloadRanges: () => {
    keepRanges: SegmentRangePayload[];
    removeRanges: SegmentRangePayload[];
  };
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

function mergeAndSumDurations(lines: SubtitleLine[]): number {
  if (lines.length === 0) return 0;
  const sorted = [...lines].sort((a, b) => a.startSec - b.startSec);
  let total = 0;
  let curStart = sorted[0].startSec;
  let curEnd = sorted[0].endSec;
  for (let i = 1; i < sorted.length; i += 1) {
    const line = sorted[i];
    if (line.startSec <= curEnd) {
      curEnd = Math.max(curEnd, line.endSec);
    } else {
      total += curEnd - curStart;
      curStart = line.startSec;
      curEnd = line.endSec;
    }
  }
  total += curEnd - curStart;
  return total;
}

export function useSegmentSelection(): UseSegmentSelectionReturn {
  const [marks, setMarks] = React.useState<SegmentSelectionState>(
    () => new Map(),
  );

  const getMark = React.useCallback(
    (index: number) => marks.get(index),
    [marks],
  );

  const setMark = React.useCallback(
    (index: number, mark: SegmentMarkState) => {
      setMarks((prev) => {
        const next = new Map(prev);
        if (next.get(index) === mark) {
          next.delete(index);
        } else {
          next.set(index, mark);
        }
        return next;
      });
    },
    [],
  );

  const setManyMarks = React.useCallback(
    (indices: number[], mark: SegmentMarkState | null) => {
      setMarks((prev) => {
        const next = new Map(prev);
        for (const index of indices) {
          if (mark === null) next.delete(index);
          else next.set(index, mark);
        }
        return next;
      });
    },
    [],
  );

  const clearAll = React.useCallback(() => setMarks(new Map()), []);

  const keepIndices = React.useMemo(
    () =>
      [...marks.entries()]
        .filter(([, mark]) => mark === "keep")
        .map(([index]) => index),
    [marks],
  );
  const removeIndices = React.useMemo(
    () =>
      [...marks.entries()]
        .filter(([, mark]) => mark === "remove")
        .map(([index]) => index),
    [marks],
  );

  const keepDurationSec = React.useCallback(
    (lines: SubtitleLine[]) => {
      const byIndex = new Map(lines.map((line) => [line.index, line]));
      const keepLines = keepIndices
        .map((index) => byIndex.get(index))
        .filter((line): line is SubtitleLine => Boolean(line));
      return mergeAndSumDurations(keepLines);
    },
    [keepIndices],
  );

  const toPayloadRanges = React.useCallback(
    () => ({
      keepRanges: collapseToRanges(keepIndices),
      removeRanges: collapseToRanges(removeIndices),
    }),
    [keepIndices, removeIndices],
  );

  return {
    marks,
    getMark,
    setMark,
    setManyMarks,
    clearAll,
    isEmpty: marks.size === 0,
    keepCount: keepIndices.length,
    removeCount: removeIndices.length,
    keepDurationSec,
    toPayloadRanges,
  };
}
