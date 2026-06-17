export function formatCoursePrice(price: number) {
  return price > 0 ? `${price.toLocaleString("vi-VN")} VND` : "Miễn phí";
}

export function formatDurationLabel(duration?: string | null) {
  if (!duration) {
    return "--";
  }

  const normalized = duration.trim();
  const timeMatch = normalized.match(/^(\d{1,2}):(\d{2}):(\d{2})(?:\.\d+)?$/);
  if (timeMatch) {
    const hours = Number(timeMatch[1] ?? 0);
    const minutes = Number(timeMatch[2] ?? 0);
    const seconds = Number(timeMatch[3] ?? 0);
    const totalMinutes = hours * 60 + minutes;
    return `${totalMinutes}p${String(seconds).padStart(2, "0")}s`;
  }

  const minutesMatch = normalized.match(/^(\d+)\s*(?:phút|phut|p|m)(?:\s*(\d+)\s*(?:giây|giay|s))?$/i);
  if (minutesMatch) {
    const minutes = Number(minutesMatch[1] ?? 0);
    const seconds = Number(minutesMatch[2] ?? 0);
    return `${minutes}p${String(seconds).padStart(2, "0")}s`;
  }

  const secondsOnly = Number(normalized);
  if (Number.isFinite(secondsOnly) && secondsOnly >= 0) {
    const minutes = Math.floor(secondsOnly / 60);
    const seconds = Math.floor(secondsOnly % 60);
    return `${minutes}p${String(seconds).padStart(2, "0")}s`;
  }

  return normalized;
}
