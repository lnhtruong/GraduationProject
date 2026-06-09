/**
 * Read video duration from a local file without waiting for CDN processing.
 */
export async function getVideoDurationFromFile(
  file: File,
): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
      if (video.src.startsWith("blob:")) {
        URL.revokeObjectURL(video.src);
      }
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();
      resolve(
        Number.isFinite(duration) && duration > 0 ? duration : null,
      );
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    video.src = URL.createObjectURL(file);
  });
}
