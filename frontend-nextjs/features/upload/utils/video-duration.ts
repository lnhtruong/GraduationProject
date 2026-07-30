/**
 * Đọc thời lượng video ở phía client. Backend không tự suy ra được thời lượng
 * (inference_service không có DB), mà nó quyết định số credit quota bị trừ.
 */

/**
 * Thời lượng để tính credit: ưu tiên giá trị caller đã biết, nếu không thì tự
 * đo. Điểm chốt duy nhất — caller quên truyền vẫn không bị tính sai giá, đúng
 * lỗi đã xảy ra với HighlightUploadDialog.
 */
export async function resolveDurationSec(
  provided: number | null | undefined,
  probe: () => Promise<number | null>,
): Promise<number | undefined> {
  if (typeof provided === "number" && Number.isFinite(provided) && provided > 0) {
    return provided;
  }
  return (await probe()) ?? undefined;
}

function readNativeDuration(url: string): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.crossOrigin = "anonymous";

    const finish = (value: number | null) => {
      video.removeAttribute("src");
      video.load();
      resolve(value);
    };

    video.onloadedmetadata = () =>
      finish(Number.isFinite(video.duration) ? video.duration : null);
    video.onerror = () => finish(null);
    video.src = url;
  });
}

export function isHlsUrl(url: string): boolean {
  return /\.m3u8(\?|$)/i.test(url);
}

/**
 * Đọc thời lượng từ URL video (nhánh "Thư viện" chỉ có link, không có File).
 * Bunny phát HLS nên `<video>` thuần không lấy được metadata trên Chrome —
 * fallback sang hls.js. Trả null nếu không đọc được; khi đó backend tính
 * credit ở hệ số ×1.
 */
export async function getVideoDurationFromUrl(
  url: string,
): Promise<number | null> {
  if (!isHlsUrl(url)) return readNativeDuration(url);

  // Safari phát HLS natively; thử trước để khỏi tải hls.js.
  const native = await readNativeDuration(url);
  if (native !== null) return native;

  const { default: Hls } = await import("hls.js");
  if (!Hls.isSupported()) return null;

  return new Promise<number | null>((resolve) => {
    const video = document.createElement("video");
    const hls = new Hls();
    let settled = false;

    const finish = (value: number | null) => {
      if (settled) return;
      settled = true;
      hls.destroy();
      resolve(value);
    };

    // LEVEL_LOADED mang `totalduration` của playlist VOD; MANIFEST_PARSED bắn
    // sớm hơn và duration lúc đó còn NaN.
    hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
      const seconds = data.details.totalduration;
      finish(Number.isFinite(seconds) && seconds > 0 ? seconds : null);
    });
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (data.fatal) finish(null);
    });

    hls.loadSource(url);
    hls.attachMedia(video);
  });
}
