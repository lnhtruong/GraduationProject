export function parseDurationToSeconds(
  raw: number | string | null | undefined,
): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(0, Math.floor(raw));
  }

  if (typeof raw !== "string") {
    return 0;
  }

  const normalized = raw.trim();
  if (!normalized) {
    return 0;
  }

  const match = normalized.match(/^(\d+):(\d{2}):(\d{2})(?:\.(\d{1,3}))?$/);
  if (!match) {
    const asNumber = Number(normalized);
    return Number.isFinite(asNumber) ? Math.max(0, Math.floor(asNumber)) : 0;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const millis = Number((match[4] ?? "0").padEnd(3, "0"));

  return Math.max(
    0,
    Math.floor(hours * 3600 + minutes * 60 + seconds + millis / 1000),
  );
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(safe / 60);
  const ss = safe % 60;
  return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
}
