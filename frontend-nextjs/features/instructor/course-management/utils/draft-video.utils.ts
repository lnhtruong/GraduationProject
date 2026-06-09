export type DraftVideoState = {
  blobUrl: string | null;
  durationSeconds: number;
};

export type LessonFormVideoContext = {
  selectedVideoId: number | null;
  draftVideoBlobUrl: string | null;
  draftVideoDurationSeconds: number;
};

export function resolveActiveVideoSource(params: {
  serverUrl?: string | null;
  serverDuration?: number | null;
  draftBlobUrl?: string | null;
  draftDurationSeconds?: number;
  hasVideoId?: boolean;
}) {
  const serverDuration = Number(params.serverDuration ?? 0);
  const draftDuration = Number(params.draftDurationSeconds ?? 0);
  const durationSeconds = serverDuration > 0 ? serverDuration : draftDuration;
  const url = params.serverUrl || params.draftBlobUrl || undefined;
  const hasVideoSource = Boolean(params.hasVideoId || params.draftBlobUrl);

  return { url, durationSeconds, hasVideoSource };
}
