import type { SubtitleLine } from "../types";

/**
 * Mirrors the backend's srt_to_segments() parsing rules (colab2/main.py) so
 * `index` values line up 1:1 with what the server parses from the same file.
 */
function parseSrtTime(raw: string): number {
  const match = raw.trim().match(/(\d+):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return 0;
  const [, hh, mm, ss, ms] = match;
  return Number(hh) * 3600 + Number(mm) * 60 + Number(ss) + Number(ms) / 1000;
}

export function parseSrt(raw: string): SubtitleLine[] {
  const normalized = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n").trim();
  const blocks = normalized.split(/\n\s*\n/);
  const lines: SubtitleLine[] = [];

  for (const block of blocks) {
    const blockLines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (blockLines.length < 2) continue;

    let index: number;
    let timeLine: string;
    let textLines: string[];
    if (/^\d+$/.test(blockLines[0])) {
      index = Number(blockLines[0]);
      timeLine = blockLines[1];
      textLines = blockLines.slice(2);
    } else {
      index = lines.length + 1;
      timeLine = blockLines[0];
      textLines = blockLines.slice(1);
    }

    if (!timeLine.includes("-->")) continue;
    const [startRaw, endRaw] = timeLine.split("-->").map((t) => t.trim());

    lines.push({
      index,
      startSec: parseSrtTime(startRaw),
      endSec: parseSrtTime(endRaw),
      text: textLines.join(" "),
    });
  }

  return lines.sort((a, b) => a.startSec - b.startSec);
}

export async function fetchAndParseSrt(url: string): Promise<SubtitleLine[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Không thể tải file phụ đề.");
  }
  const raw = await response.text();
  return parseSrt(raw);
}
