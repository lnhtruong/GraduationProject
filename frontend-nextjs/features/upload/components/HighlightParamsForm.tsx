import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useVideoById } from "@/features/video/api/video.hooks";
import {
  INFERENCE_JOB_STORAGE_TTL_MS,
  clearPersistedInferenceJob,
  readPersistedInferenceJob,
  watchInferenceJob,
  writePersistedInferenceJob,
} from "@/features/_shared/realtime/inference-job-watcher";

import {
  highlightParamsSchema,
  type HighlightParamsFormValues,
} from "../schemas";
import type { HighlightParams } from "../types";
import { useSegmentSelection } from "../hooks/useSegmentSelection";
import { transcribeApi } from "../api/transcribe.api";
import { useStartTranscribeJob } from "../api/transcribe.hooks";
import { fetchAndParseSrt } from "../utils/srt.utils";
import SegmentPickerSheet, {
  type PickerVideoState,
} from "./SegmentPicker/SegmentPickerSheet";

const SEGMENT_SELECTION_TARGET_MAX = 180;
const TRANSCRIBE_JOB_STORAGE = {
  key: "learnhub:active-transcribe-job",
  storage: "local" as const,
  ttlMs: INFERENCE_JOB_STORAGE_TTL_MS,
};

interface HighlightParamsFormProps {
  onSubmit: (params: HighlightParams) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  noCard?: boolean;
  compact?: boolean;
  formId?: string;
  hideActions?: boolean;
  /** Chặn submit khi không đủ credit quota. Nội dung riêng render bên ngoài form. */
  submitDisabled?: boolean;
  /** ADR 0002: video được upload song song lúc điền form, không đợi submit. */
  isUploadingSource?: boolean;
  uploadProgress?: number | null;
  uploadError?: string | null;
  /** Có khi pre-upload (ADR 0002) đã resolve xong — cần cho segment picker. */
  videoId?: number | null;
  videoUrl?: string | null;
}

const INCLUDE_PRESETS = [
  "Ví dụ thực tế",
  "Giải thích cốt lõi",
  "Hướng dẫn từng bước",
  "Mẹo quan trọng",
  "Đoạn dễ hiểu",
];

const EXCLUDE_PRESETS = [
  "Chào đầu video",
  "Quảng cáo",
  "Đoạn im lặng",
  "Nội dung lặp lại",
  "Phần ngoài chủ đề",
];

function parsePreferences(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinPreferences(values: string[]) {
  return values.join(", ");
}

export default function HighlightParamsForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
  noCard = false,
  compact = false,
  formId,
  hideActions = false,
  submitDisabled = false,
  isUploadingSource = false,
  uploadProgress = null,
  uploadError = null,
  videoId = null,
  videoUrl = null,
}: HighlightParamsFormProps) {
  const [includeInput, setIncludeInput] = React.useState("");
  const [excludeInput, setExcludeInput] = React.useState("");
  const form = useForm<HighlightParamsFormValues>({
    resolver: zodResolver(highlightParamsSchema),
    defaultValues: {
      topic: "",
      includeKeywords: [],
      excludeKeywords: [],
      isMultiOutput: false,
      isOpenAI: false,
    },
  });

  const watchedIsOpenAI = form.watch("isOpenAI");
  const watchedIsMultiOutput = form.watch("isMultiOutput");

  // ---- Segment Selection Picker (specs/002-highlight-segment-picker-ui,
  // colab2 repo). segmentSelection is instantiated HERE, at the form level
  // — not inside SegmentPickerSheet — so marks survive the Sheet closing
  // and the entry-point button being disabled/re-enabled (FR-014). ----
  const segmentSelection = useSegmentSelection();
  const { user } = useAuth();
  const resolvedUserId = user?.id;

  const hasSupportedMode =
    watchedIsOpenAI === true && watchedIsMultiOutput === false;
  const canUseSegmentPicker = hasSupportedMode && videoId != null;

  const [isPickerOpen, setIsPickerOpen] = React.useState(false);
  const [transcribeStatus, setTranscribeStatus] = React.useState<
    "idle" | "running" | "failed"
  >("idle");
  const [transcribeJobId, setTranscribeJobId] = React.useState<string | null>(
    null,
  );

  const { data: video, refetch: refetchVideo } = useVideoById(
    videoId,
    videoId != null,
  );

  const startTranscribeMutation = useStartTranscribeJob({
    onJobStarted: (jobId) => {
      setTranscribeJobId(jobId);
      setTranscribeStatus("running");
    },
    onError: () => {
      setTranscribeStatus("failed");
      toast.error("Không thể bắt đầu transcribe. Vui lòng thử lại.");
    },
  });

  // Resume a persisted transcribe job (e.g. after a page reload) for this video.
  React.useEffect(() => {
    if (!videoId || !resolvedUserId) return;
    const saved = readPersistedInferenceJob({
      ...TRANSCRIBE_JOB_STORAGE,
      userId: resolvedUserId,
      contextId: videoId,
    });
    if (saved) {
      setTranscribeJobId(saved.jobId);
      setTranscribeStatus("running");
    }
  }, [videoId, resolvedUserId]);

  React.useEffect(() => {
    if (!resolvedUserId || !videoId) return;
    if (transcribeStatus === "running" && transcribeJobId) {
      writePersistedInferenceJob(
        { ...TRANSCRIBE_JOB_STORAGE, userId: resolvedUserId, contextId: videoId },
        { jobId: transcribeJobId, status: "pending", contextId: videoId },
      );
    } else {
      clearPersistedInferenceJob({ ...TRANSCRIBE_JOB_STORAGE });
    }
  }, [resolvedUserId, videoId, transcribeStatus, transcribeJobId]);

  React.useEffect(() => {
    if (!transcribeJobId || !resolvedUserId || transcribeStatus !== "running") {
      return;
    }

    const matchesJob = (candidateJobId: unknown) =>
      candidateJobId != null && String(candidateJobId) === transcribeJobId;

    const handleDone = () => {
      setTranscribeStatus("idle");
      setTranscribeJobId(null);
      void refetchVideo();
      toast.success("Transcribe hoàn tất — video đã sẵn sàng để chọn đoạn.");
    };
    const handleFailed = () => {
      setTranscribeStatus("failed");
      toast.error("Transcribe thất bại. Vui lòng thử lại.");
    };

    const watcher = watchInferenceJob({
      userId: resolvedUserId,
      pollStatus: () => transcribeApi.getJobStatus(transcribeJobId),
      onPollStatus: (status) => {
        const record = status as Record<string, unknown>;
        const jobStatus = String(record.status ?? "");
        if (jobStatus === "completed") handleDone();
        else if (["failed", "error", "cancelled", "canceled"].includes(jobStatus))
          handleFailed();
      },
      onCompleted: (payload) => {
        const record = payload as unknown as {
          data?: { job_id?: string; jobId?: string };
        };
        if (matchesJob(record.data?.job_id ?? record.data?.jobId)) handleDone();
      },
      onError: (payload) => {
        const record = payload as unknown as { jobId?: string };
        if (matchesJob(record.jobId)) handleFailed();
      },
    });

    return () => watcher.close();
  }, [transcribeJobId, resolvedUserId, transcribeStatus, refetchVideo]);

  const videoState: PickerVideoState = React.useMemo(() => {
    if (transcribeStatus === "running") return { kind: "transcribing" };
    if (!videoId) return { kind: "loading" };
    const srtUrl = video?.srt_raw_url ?? video?.srtRawUrl ?? null;
    if (!srtUrl) return { kind: "no-transcript" };
    return { kind: "ready", srtUrl };
  }, [transcribeStatus, videoId, video]);

  const [subtitleLines, setSubtitleLines] = React.useState<
    import("../types").SubtitleLine[]
  >([]);
  const [isLoadingSrt, setIsLoadingSrt] = React.useState(false);
  const [srtError, setSrtError] = React.useState<string | null>(null);
  const loadedSrtUrlRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (videoState.kind !== "ready") return;
    if (loadedSrtUrlRef.current === videoState.srtUrl) return;

    let cancelled = false;
    setIsLoadingSrt(true);
    setSrtError(null);
    fetchAndParseSrt(videoState.srtUrl)
      .then((parsed) => {
        if (cancelled) return;
        loadedSrtUrlRef.current = videoState.srtUrl;
        setSubtitleLines(parsed);
      })
      .catch(() => {
        if (!cancelled) setSrtError("Không thể tải phụ đề. Vui lòng thử lại.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingSrt(false);
      });

    return () => {
      cancelled = true;
    };
  }, [videoState]);

  const keepDurationSec = segmentSelection.keepDurationSec(subtitleLines);
  const exceedsTargetMax = keepDurationSec > SEGMENT_SELECTION_TARGET_MAX;

  const handleOpenPicker = () => {
    if (!canUseSegmentPicker) return;
    setIsPickerOpen(true);
  };

  const handleStartTranscribe = () => {
    if (!videoId || !videoUrl) return;
    startTranscribeMutation.mutate({ videoUrl, videoId });
  };
  // ---- end Segment Selection Picker wiring ----

  const handleFormSubmit = form.handleSubmit((data) => {
    const { keepRanges, removeRanges } = segmentSelection.toPayloadRanges();
    const usesSegmentSelection = keepRanges.length > 0 || removeRanges.length > 0;

    if (usesSegmentSelection && exceedsTargetMax) {
      toast.error(
        "Tổng thời lượng đoạn ưu tiên đang vượt quá giới hạn cho phép.",
      );
      return;
    }

    onSubmit({
      topic: data.topic.trim(),
      includeKeywords: data.includeKeywords,
      excludeKeywords: data.excludeKeywords,
      isMultiOutput: data.isMultiOutput,
      isOpenAI: data.isOpenAI,
      ...(usesSegmentSelection ? { keepRanges, removeRanges } : {}),
    });
  });

  const applyPreset = React.useCallback(
    (
      fieldName: "includeKeywords" | "excludeKeywords",
      value: string,
      setInput: React.Dispatch<React.SetStateAction<string>>,
    ) => {
      const nextValues = Array.from(
        new Set([...form.getValues(fieldName), value]),
      );
      form.setValue(fieldName, nextValues, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setInput(joinPreferences(nextValues));
    },
    [form],
  );

  const content = (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={handleFormSubmit}
        className={compact ? "space-y-4" : "space-y-6"}
      >
        {isUploadingSource && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Đang tải video lên hệ thống
              {typeof uploadProgress === "number" ? ` (${uploadProgress}%)` : ""}
              . Bạn có thể tiếp tục điền form, việc tải sẽ chạy song song.
            </AlertDescription>
          </Alert>
        )}
        {uploadError && !isUploadingSource && (
          <Alert variant="destructive">
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        <div>
          <h3 className={cn("font-semibold", compact ? "text-lg" : "text-xl")}>
            Bạn muốn lấy phần nào trong video?
          </h3>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Mô tả mục tiêu học để StudyLoop ưu tiên đúng đoạn cần giữ.
          </p>
        </div>

        <FormField
          control={form.control}
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Video này nói về gì? <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ví dụ: React hooks, kỹ năng thuyết trình, thuật toán cây nhị phân..."
                  {...field}
                  disabled={isSubmitting}
                  className={cn(compact ? "h-11" : "h-12 text-base")}
                />
              </FormControl>
              <FormDescription>
                Càng rõ chủ đề thì đoạn highlight càng dễ đúng ý.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isOpenAI"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Chất lượng phân tích
              </FormLabel>
              <FormControl>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => field.onChange(false)}
                    className={cn(
                      "cursor-pointer rounded-lg border bg-background text-left transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-70",
                      compact ? "p-3" : "p-4",
                      !field.value && "border-primary shadow-sm",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          !field.value
                            ? "border-primary"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {!field.value ? (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        ) : null}
                      </span>
                      <div>
                        <div className="font-semibold">Tiêu chuẩn</div>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          Dùng luồng phân tích mặc định của StudyLoop.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => field.onChange(true)}
                    className={cn(
                      "cursor-pointer rounded-lg border bg-background text-left transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-70",
                      compact ? "p-3" : "p-4",
                      field.value && "border-primary shadow-sm",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          field.value
                            ? "border-primary"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {field.value ? (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        ) : null}
                      </span>
                      <div>
                        <div className="font-semibold">Nâng cao với OpenAI</div>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          Ưu tiên phân tích bằng OpenAI cho nội dung cần độ chính xác cao hơn.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isMultiOutput"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-medium">
                Kiểu kết quả
              </FormLabel>
              <FormControl>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => field.onChange(false)}
                    className={cn(
                      "cursor-pointer rounded-lg border bg-background text-left transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-70",
                      compact ? "p-3" : "p-4",
                      !field.value && "border-primary shadow-sm",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          !field.value
                            ? "border-primary"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {!field.value ? (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        ) : null}
                      </span>
                      <div>
                        <div className="font-semibold">Một đoạn hay nhất</div>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          Dùng khi muốn mở Studio nhanh và chỉnh tiếp ngay.
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => field.onChange(true)}
                    className={cn(
                      "cursor-pointer rounded-lg border bg-background text-left transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-70",
                      compact ? "p-3" : "p-4",
                      field.value && "border-primary shadow-sm",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                          field.value
                            ? "border-primary"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {field.value ? (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        ) : null}
                      </span>
                      <div>
                        <div className="font-semibold">Nhiều đoạn để chọn</div>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          Dùng khi video dài và cần so sánh vài phương án.
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-3">
          <Button
            type="button"
            variant="outline"
            disabled={!canUseSegmentPicker}
            onClick={handleOpenPicker}
            className="gap-2"
          >
            Chọn đoạn ưu tiên/loại bỏ
            {transcribeStatus === "running" && (
              <Badge variant="secondary">Đang transcribe...</Badge>
            )}
            {transcribeStatus !== "running" &&
              (segmentSelection.keepCount > 0 ||
                segmentSelection.removeCount > 0) && (
                <Badge>
                  {segmentSelection.keepCount} ưu tiên ·{" "}
                  {segmentSelection.removeCount} loại bỏ
                </Badge>
              )}
          </Button>
          {!canUseSegmentPicker && (
            <p className="text-xs text-muted-foreground">
              {!hasSupportedMode
                ? 'Cần bật "Nâng cao với OpenAI" và chọn "Một đoạn hay nhất" để dùng tính năng này.'
                : "Chỉ dùng được khi tạo highlight từ video vừa tải lên (tab \"Tải từ máy\")."}
            </p>
          )}
        </div>

        <SegmentPickerSheet
          open={isPickerOpen}
          onOpenChange={setIsPickerOpen}
          videoState={videoState}
          segmentSelection={segmentSelection}
          targetMaxSec={SEGMENT_SELECTION_TARGET_MAX}
          onStartTranscribe={handleStartTranscribe}
          isStartingTranscribe={startTranscribeMutation.isPending}
          lines={subtitleLines}
          isLoadingSrt={isLoadingSrt}
          srtError={srtError}
        />

        <div className="grid items-stretch gap-4 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="includeKeywords"
            render={({ field }) => (
              <FormItem className="flex h-full flex-col">
                <FormLabel className="text-base font-medium">
                  Muốn giữ lại nội dung gì?
                </FormLabel>
                <FormControl>
                  <Input
                    value={includeInput}
                    onChange={(event) => {
                      setIncludeInput(event.target.value);
                      field.onChange(parsePreferences(event.target.value));
                    }}
                    placeholder="Ví dụ: ví dụ thực tế, đoạn minh họa, công thức quan trọng"
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <div
                  className={cn(
                    "flex content-start flex-wrap gap-2 pt-1",
                    compact ? "min-h-0" : "min-h-[5.75rem]",
                  )}
                >
                  {INCLUDE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() =>
                        applyPreset("includeKeywords", preset, setIncludeInput)
                      }
                      className="cursor-pointer rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <FormDescription className="mt-auto">
                  Có thể nhập nhiều ý, cách nhau bằng dấu phẩy.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="excludeKeywords"
            render={({ field }) => (
              <FormItem className="flex h-full flex-col">
                <FormLabel className="text-base font-medium">
                  Muốn bỏ qua phần nào?
                </FormLabel>
                <FormControl>
                  <Input
                    value={excludeInput}
                    onChange={(event) => {
                      setExcludeInput(event.target.value);
                      field.onChange(parsePreferences(event.target.value));
                    }}
                    placeholder="Ví dụ: chào đầu, quảng cáo, đoạn nghỉ"
                    disabled={isSubmitting}
                    className="h-11"
                  />
                </FormControl>
                <div
                  className={cn(
                    "flex content-start flex-wrap gap-2 pt-1",
                    compact ? "min-h-0" : "min-h-[5.75rem]",
                  )}
                >
                  {EXCLUDE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() =>
                        applyPreset("excludeKeywords", preset, setExcludeInput)
                      }
                      className="cursor-pointer rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <FormDescription className="mt-auto">
                  Để trống nếu muốn StudyLoop tự chọn tự nhiên.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!hideActions && (
        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-11 flex-1"
          >
            Quay lại
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || submitDisabled || exceedsTargetMax}
            className="h-11 flex-1"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang xử lý
              </>
            ) : (
              <>
                Tạo highlight
              </>
            )}
          </Button>
        </div>
        )}
      </form>
    </Form>
  );

  if (noCard) return <div className={compact ? "p-0" : "p-1"}>{content}</div>;

  return <Card className="p-5 sm:p-6">{content}</Card>;
}

