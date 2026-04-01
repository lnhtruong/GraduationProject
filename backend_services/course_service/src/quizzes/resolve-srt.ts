/**
 * `srt_raw_url` in DB is normally a Cloudinary HTTPS URL to the .srt file.
 * This helper loads plain-text SRT for the quiz generator. Inline text is still supported.
 */
export async function resolveSrtRawForQuiz(srtRaw: string): Promise<string> {
  const t = srtRaw.trim();
  if (!t) {
    throw new Error('Empty srt_raw_url');
  }
  if (/^https?:\/\//i.test(t)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const res = await fetch(t, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch SRT: HTTP ${res.status}`);
      }
      const body = (await res.text()).trim();
      if (!body) {
        throw new Error('SRT URL returned empty body');
      }
      return body;
    } finally {
      clearTimeout(timer);
    }
  }
  return t;
}
