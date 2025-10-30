import { useRef, useState } from "react";
import {
  uploadHighlightReel,
  getJobStatus,
  downloadResult,
  downloadResultByUrl,
} from "@/services/urlService";
import type { Clip } from "@/features/upload/types";

export function useUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  const stopPollingRef = useRef<(() => void) | null>(null);

  async function startUpload(fileToUpload: File) {
    setFile(fileToUpload);
    setProgress(0);
    setClips([]);
    setJobId(null);
    setStatus(null); // Reset status

    try {
      // build FormData
      const form = new FormData();
      form.append("file", fileToUpload);
      form.append("topic", "Binary Tree data structures and problem-solving");
      form.append(
        "include_keywords",
        '"solution explanations","step-by-step problem solving","algorithm analysis","implementation details","time/space complexity discussion"'
      );
      form.append(
        "exclude_keywords",
        '"advertisements","course promotions","discount announcements","channel subscriptions","greetings and sign-offs","emotional filler"'
      );

      // perform upload (no XHR progress callback to avoid XHR-specific behavior)
      setProgress(100); // Set progress to 100% after upload
      const resp = await uploadHighlightReel(form);
      setProgress(null); // Remove progress bar after upload

      // server may return { data: { id } } or { job_id } or { jobId } or { id }
      const r = resp as Record<string, unknown> | null;
      let id: string | null = null;
      if (r) {
        if (typeof r["data"] === "object" && r["data"] !== null) {
          const d = r["data"] as Record<string, unknown>;
          if (typeof d["id"] === "string") id = d["id"] as string;
          else if (typeof d["job_id"] === "string") id = d["job_id"] as string;
        }
        if (!id) {
          if (typeof r["job_id"] === "string") id = r["job_id"] as string;
          else if (typeof r["jobId"] === "string") id = r["jobId"] as string;
          else if (typeof r["id"] === "string") id = r["id"] as string;
        }
      }

      if (id) {
        setJobId(id);
        setStatus("pending"); // Set initial status

        // start polling every 1s
        let stopped = false;
        const interval = setInterval(async () => {
          if (stopped) {
            clearInterval(interval);
            return;
          }
          try {
            const st = await getJobStatus(id);

            // st is the direct response, not wrapped in .data
            const payload = st as Record<string, unknown>;

            // extract status/state safely
            let s: string | null = null;
            if (payload) {
              const statusVal = payload["status"] ?? payload["state"];
              if (typeof statusVal === "string") s = statusVal;
            }

            setStatus(s);

            if (s === "completed") {
              stopped = true;
              clearInterval(interval);

              // if backend provided a download URL in the job result, use it
              try {
                const result = payload["result"] as
                  | Record<string, unknown>
                  | undefined;

                // Check multiple possible download URL fields
                let downloadUrl: string | null = null;
                if (result) {
                  downloadUrl =
                    (typeof result["download_url"] === "string"
                      ? result["download_url"]
                      : null) ||
                    (typeof result["output_filename"] === "string"
                      ? result["output_filename"]
                      : null) ||
                    (typeof result["url"] === "string" ? result["url"] : null);
                }

                // Also check direct fields on payload
                if (!downloadUrl) {
                  downloadUrl =
                    (typeof payload["download_url"] === "string"
                      ? payload["download_url"]
                      : null) ||
                    (typeof payload["output_filename"] === "string"
                      ? payload["output_filename"]
                      : null) ||
                    (typeof payload["url"] === "string"
                      ? payload["url"]
                      : null);
                }

                if (downloadUrl) {
                  // fetch and handle the download using the provided path/url
                  void fetchAndHandleDownloadFromUrl(
                    downloadUrl,
                    file?.name || `${id}.mp4`
                  );
                } else {
                  void fetchAndHandleDownload(id);
                }
              } catch {
                // fallback to default download
                void fetchAndHandleDownload(id);
              }
            }
            if (s === "failed") {
              stopped = true;
              clearInterval(interval);
            }
          } catch {
            // ignore transient polling errors
          }
        }, 1000); // Changed to 1 second polling

        stopPollingRef.current = () => {
          stopped = true;
          clearInterval(interval);
        };
      }
    } catch {
      setProgress(null);
    }
  }

  function cancel() {
    setFile(null);
    setProgress(null);
    setStatus(null);
    if (stopPollingRef.current) stopPollingRef.current();
    stopPollingRef.current = null;
  }

  async function fetchAndHandleDownload(id: string) {
    setIsDownloading(true);
    try {
      const resp = await downloadResult(id);
      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const payload = (await resp.json()) as unknown;

        // payload may be { clips: [...] } or an array
        if (
          typeof payload === "object" &&
          payload !== null &&
          "clips" in (payload as Record<string, unknown>)
        ) {
          const maybeClips = (payload as Record<string, unknown>)["clips"];
          if (Array.isArray(maybeClips)) {
            const mapped = maybeClips.map((it) => {
              if (typeof it === "string") return { name: it, url: it };
              if (typeof it === "object" && it !== null) {
                const r = it as Record<string, unknown>;
                return {
                  name:
                    typeof r["name"] === "string" ? (r["name"] as string) : "",
                  url: typeof r["url"] === "string" ? (r["url"] as string) : "",
                };
              }
              return { name: "clip", url: String(it) };
            });
            setClips(mapped as Clip[]);
          }
        } else if (Array.isArray(payload)) {
          const mapped = (payload as unknown[]).map((item, i) => {
            if (typeof item === "string")
              return { name: `clip-${i + 1}`, url: item };
            if (typeof item === "object" && item !== null) {
              const r = item as Record<string, unknown>;
              return {
                name:
                  typeof r["name"] === "string"
                    ? (r["name"] as string)
                    : `clip-${i + 1}`,
                url:
                  typeof r["url"] === "string"
                    ? (r["url"] as string)
                    : String(item),
              };
            }
            return { name: `clip-${i + 1}`, url: String(item) };
          });
          setClips(mapped as Clip[]);
        }
      } else {
        const blob = await resp.blob();
        if (contentType.includes("zip")) {
          const url = URL.createObjectURL(blob);
          setClips([{ name: `${id}.zip`, url }]);
        } else if (blob.type.startsWith("video/")) {
          const url = URL.createObjectURL(blob);
          setClips([{ name: file?.name || "result.mp4", url }]);
        } else {
          const url = URL.createObjectURL(blob);
          setClips([{ name: `${id}.bin`, url }]);
        }
      }
    } catch {
      // ignore download errors
    } finally {
      setIsDownloading(false);
      setProgress(null);
    }
  }

  async function fetchAndHandleDownloadFromUrl(
    pathOrUrl: string,
    fallbackName?: string
  ) {
    setIsDownloading(true);
    try {
      const resp = await downloadResultByUrl(pathOrUrl);
      const contentType = resp.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const payload = (await resp.json()) as unknown;
        // if server returned JSON metadata with a URL, try to fetch that
        if (
          typeof payload === "object" &&
          payload !== null &&
          "download_url" in (payload as Record<string, unknown>)
        ) {
          const u = (payload as Record<string, unknown>)[
            "download_url"
          ] as string;
          if (u) {
            // fetch the actual binary
            const binResp = await downloadResultByUrl(u);
            const blob = await binResp.blob();
            const url = URL.createObjectURL(blob);
            const baseName =
              fallbackName ??
              (() => {
                const parts = u.split("/").filter(Boolean);
                return parts.length ? parts[parts.length - 1] : "result.mp4";
              })();
            setClips([{ name: baseName, url }]);
            return;
          }
        }
      }

      // otherwise treat as binary
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const baseName =
        fallbackName ??
        (() => {
          const parts = pathOrUrl.split("/").filter(Boolean);
          return parts.length ? parts[parts.length - 1] : "result";
        })();
      if (contentType.includes("zip")) {
        setClips([{ name: `${baseName}.zip`, url }]);
      } else if (blob.type.startsWith("video/")) {
        setClips([{ name: fallbackName || file?.name || `${baseName}`, url }]);
      } else {
        setClips([{ name: `${baseName}.bin`, url }]);
      }
    } catch {
      // ignore
    } finally {
      setIsDownloading(false);
      setProgress(null);
    }
  }

  return {
    file,
    setFile,
    progress,
    status,
    jobId,
    clips,
    isDownloading,
    startUpload,
    cancel,
  };
}

export default useUpload;
