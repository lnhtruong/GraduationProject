"use client";

import { useRef, useState, useEffect, type MutableRefObject } from "react";
import { CheckCircle2, RefreshCw, Trash2, Undo2 } from "lucide-react";
import Hls from "hls.js";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useAllQuizQuestionsQuery,
  useDeleteQuizQuestionMutation,
  useRestoreQuizQuestionsMutation,
  useFilterQuizQuestionsMutation,
} from "../../api/ai-quiz.hooks";

interface Props {
  quizId: number;
  lessonVideoUrl?: string;
  onComplete: () => Promise<void> | void;
}

type ReviewQuestionOption = {
  id: number;
  optionText: string;
  isCorrect: boolean;
};

type ReviewQuestion = {
  id: number;
  quesText: string;
  point: number;
  evidenceTimestamp?: string | null;
  explanation?: string | null;
  options: ReviewQuestionOption[];
};

function isHlsUrl(url: string) {
  return /\.m3u8(?:$|[?#])/i.test(url);
}

function attachVideoSource(
  videoElement: HTMLVideoElement,
  sourceUrl: string | undefined,
  hlsRef: MutableRefObject<Hls | null>,
) {
  videoElement.pause();
  videoElement.removeAttribute("src");

  if (hlsRef.current) {
    hlsRef.current.destroy();
    hlsRef.current = null;
  }

  if (!sourceUrl) {
    videoElement.load();
    return;
  }

  if (isHlsUrl(sourceUrl)) {
    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 15,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(sourceUrl);
      hls.attachMedia(videoElement);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            console.error("[QuizAIReviewer] HLS playback failed", data);
            hls.destroy();
            hlsRef.current = null;
            break;
        }
      });
      return;
    }

    if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      videoElement.src = sourceUrl;
      videoElement.load();
      return;
    }

    console.error("[QuizAIReviewer] Browser cannot play HLS video", sourceUrl);
    return;
  }

  videoElement.src = sourceUrl;
  videoElement.load();
}

export function QuizAIReviewer({ quizId, lessonVideoUrl, onComplete }: Props) {
  const videoRefDesktop = useRef<HTMLVideoElement | null>(null);
  const videoRefMobile = useRef<HTMLVideoElement | null>(null);
  const hlsDesktopRef = useRef<Hls | null>(null);
  const hlsMobileRef = useRef<Hls | null>(null);

  const { data, isFetching, isLoading } = useAllQuizQuestionsQuery(quizId);
  const deleteMutation = useDeleteQuizQuestionMutation(quizId);
  const restoreMutation = useRestoreQuizQuestionsMutation(quizId);
  const filterMutation = useFilterQuizQuestionsMutation(quizId);

  const activeQuestions = (data?.active ?? []) as ReviewQuestion[];
  const deletedQuestions = (data?.deleted ?? []) as ReviewQuestion[];
  const knownActiveIdsRef = useRef<Set<number>>(new Set());

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedDeletedIds, setSelectedDeletedIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Mobile viewport states
  const [showVideoMobile, setShowVideoMobile] = useState<boolean>(true);
  const [activeTabMobile, setActiveTabMobile] = useState<"active" | "deleted">("active");

  useEffect(() => {
    if (!data) return;

    const nextActiveIds = ((data.active ?? []) as ReviewQuestion[]).map(
      (question) => question.id,
    );
    const nextActiveSet = new Set(nextActiveIds);
    const previousActiveSet = knownActiveIdsRef.current;

    setSelectedIds((prev) => {
      const stillActiveSelection = prev.filter((id) => nextActiveSet.has(id));
      const newlyActiveIds = nextActiveIds.filter((id) => !previousActiveSet.has(id));
      return Array.from(new Set([...stillActiveSelection, ...newlyActiveIds]));
    });

    knownActiveIdsRef.current = nextActiveSet;
  }, [data]);

  useEffect(() => {
    if (!data) return;

    const deletedIdSet = new Set(
      ((data.deleted ?? []) as ReviewQuestion[]).map((question) => question.id),
    );
    setSelectedDeletedIds((prev) => prev.filter((id) => deletedIdSet.has(id)));
  }, [data]);

  useEffect(() => {
    const videoElement = videoRefDesktop.current;
    if (!videoElement) return;

    attachVideoSource(videoElement, lessonVideoUrl, hlsDesktopRef);

    return () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute("src");
        try {
          videoElement.load();
        } catch {}
      }
      if (hlsDesktopRef.current) {
        hlsDesktopRef.current.destroy();
        hlsDesktopRef.current = null;
      }
    };
    // isLoading is included because the <video> element only mounts once
    // loading finishes (see the early `if (isLoading) return` below) — the
    // ref is null on the first run of this effect otherwise.
  }, [lessonVideoUrl, isLoading]);

  useEffect(() => {
    const videoElement = videoRefMobile.current;
    if (!videoElement) return;

    attachVideoSource(videoElement, lessonVideoUrl, hlsMobileRef);

    return () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.removeAttribute("src");
        try {
          videoElement.load();
        } catch {}
      }
      if (hlsMobileRef.current) {
        hlsMobileRef.current.destroy();
        hlsMobileRef.current = null;
      }
    };
  }, [lessonVideoUrl, showVideoMobile, isLoading]);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === activeQuestions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(activeQuestions.map((q) => q.id));
    }
  };

  const toggleSelectDeleted = (id: number) => {
    setSelectedDeletedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllDeleted = () => {
    if (selectedDeletedIds.length === deletedQuestions.length) {
      setSelectedDeletedIds([]);
    } else {
      setSelectedDeletedIds(deletedQuestions.map((q) => q.id));
    }
  };

  const handleBulkDelete = async () => {
    const deleteIds = activeQuestions
      .map((question) => question.id)
      .filter((id) => !selectedIds.includes(id));

    if (deleteIds.length === 0) return;
    try {
      await Promise.all(deleteIds.map((id) => deleteMutation.mutateAsync(id)));
      setSelectedIds((prev) => prev.filter((id) => !deleteIds.includes(id)));
      toast.success(`Đã loại bỏ ${deleteIds.length} câu hỏi chưa chọn.`);
    } catch {
      toast.error("Đã xảy ra lỗi khi loại bỏ câu hỏi.");
    }
  };

  const handleBulkRestore = async () => {
    if (selectedDeletedIds.length === 0) return;
    try {
      await restoreMutation.mutateAsync(selectedDeletedIds);
      setSelectedDeletedIds([]);
      toast.success(`Đã khôi phục ${selectedDeletedIds.length} câu hỏi đã chọn.`);
    } catch {
      toast.error("Đã xảy ra lỗi khi khôi phục câu hỏi.");
    }
  };

  const handleRestoreAll = async () => {
    if (deletedQuestions.length === 0) return;
    try {
      const allIds = deletedQuestions.map((q) => q.id);
      await restoreMutation.mutateAsync(allIds);
      setSelectedDeletedIds([]);
      toast.success("Đã khôi phục toàn bộ câu hỏi đã loại bỏ.");
    } catch {
      toast.error("Đã xảy ra lỗi khi khôi phục câu hỏi.");
    }
  };

  const handleSeek = (timestamp: string | null) => {
    if (!timestamp) return;
    // Format timestamp "HH:MM:SS.mmm" or "HH:MM:SS,mmm" to seconds
    const [base = "00:00:00", decimal = "0"] = timestamp.replace(",", ".").split(".");
    const [h = "0", m = "0", s = "0"] = base.split(":");
    const seconds = Number(h) * 3600 + Number(m) * 60 + Number(s) + Number(decimal) / 1000;

    // Desktop and mobile layouts both keep a <video> mounted (hidden via CSS,
    // not unmounted), so only the one actually visible at this viewport
    // should play — otherwise both play and their audio overlaps.
    const isDesktopViewport = window.matchMedia("(min-width: 1024px)").matches;
    const [activeRef, inactiveRef] = isDesktopViewport
      ? [videoRefDesktop, videoRefMobile]
      : [videoRefMobile, videoRefDesktop];

    inactiveRef.current?.pause();

    if (activeRef.current) {
      activeRef.current.currentTime = seconds;
      activeRef.current.play().catch(() => {});
    }
  };

  const handleToggleQuestion = async (questionId: number, active: boolean) => {
    if (active) {
      await deleteMutation.mutateAsync(questionId);
      setSelectedIds((prev) => prev.filter((id) => id !== questionId));
    } else {
      await restoreMutation.mutateAsync([questionId]);
      setSelectedDeletedIds((prev) => prev.filter((id) => id !== questionId));
    }
  };

  const isQuestionMutationPending =
    deleteMutation.isPending ||
    restoreMutation.isPending ||
    filterMutation.isPending ||
    isSaving;
  const canSaveQuiz =
    Boolean(data) &&
    !isLoading &&
    !isFetching &&
    !isQuestionMutationPending &&
    selectedIds.some((id) => activeQuestions.some((question) => question.id === id));

  const handleSaveAndComplete = async () => {
    if (!data || isLoading || isFetching) {
      toast.warning("Danh sách câu hỏi chưa tải xong, vui lòng thử lại sau.");
      return;
    }

    const activeIdSet = new Set(activeQuestions.map((q) => q.id));
    const keepIds = selectedIds.filter((id) => activeIdSet.has(id));
    if (keepIds.length === 0) {
      toast.warning("Vui lòng chọn ít nhất một câu hỏi để lưu quiz.");
      return;
    }

    setIsSaving(true);
    try {
      await filterMutation.mutateAsync(keepIds);
      await onComplete();
    } catch {
      toast.error("Không thể lưu quiz. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderActiveQuestionCard = (q: ReviewQuestion, idx: number) => {
    return (
      <Card key={q.id} className="border-border bg-card shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <input
                type="checkbox"
                checked={selectedIds.includes(q.id)}
                onChange={() => toggleSelect(q.id)}
                aria-label="Chọn câu hỏi để lưu"
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary shrink-0 mt-1"
              />
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {idx + 1}
                </span>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "rounded-full text-[10px] uppercase font-bold",
                    q.point >= 2
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      : q.point >= 1.5
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  )}
                >
                  {q.point >= 2 ? "Khó" : q.point >= 1.5 ? "Vừa" : "Dễ"} ({q.point}đ)
                </Badge>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleToggleQuestion(q.id, true)}
              className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-lg shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-sm font-semibold text-foreground leading-relaxed">
            {q.quesText}
          </p>

          <div className="grid gap-2 sm:grid-cols-2 mt-2">
            {q.options.map((opt: ReviewQuestionOption) => (
              <div
                key={opt.id}
                className={cn(
                  "flex items-start gap-2 rounded-xl border p-3 text-xs font-medium leading-normal",
                  opt.isCorrect
                    ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                    : "border-border bg-muted/20 text-muted-foreground"
                )}
              >
                <span className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                  opt.isCorrect ? "bg-emerald-500 text-white" : "bg-muted-foreground/20"
                )}>
                  {opt.isCorrect ? "✓" : ""}
                </span>
                <span className="break-words">{opt.optionText}</span>
              </div>
            ))}
          </div>

          {q.explanation && (
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Giải thích (AI)
              </p>
              <p className="text-xs text-foreground leading-relaxed">
                {q.explanation}
              </p>
              {q.evidenceTimestamp && (
                <button
                  type="button"
                  onClick={() => handleSeek(q.evidenceTimestamp ?? null)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-500 hover:text-sky-600 transition-colors"
                >
                   Xem bằng chứng ({q.evidenceTimestamp.split(".")[0].slice(3)})
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDeletedQuestionItem = (q: ReviewQuestion) => {
    return (
      <div key={q.id} className="flex items-start justify-between gap-3 rounded-xl border border-dashed border-border bg-background p-3 text-xs">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <input
            type="checkbox"
            checked={selectedDeletedIds.includes(q.id)}
            onChange={() => toggleSelectDeleted(q.id)}
            className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary shrink-0 mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-muted-foreground line-clamp-2">{q.quesText}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleToggleQuestion(q.id, false)}
          className="h-7 rounded-lg border-primary/20 text-primary hover:bg-primary/5 flex items-center gap-1 font-semibold px-2 shrink-0"
        >
          <Undo2 className="h-3 w-3" />
          Hoàn tác
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Đang tải danh sách câu hỏi...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-5 gap-6 flex-1 min-h-0 h-full w-full overflow-hidden">
      
      {/* ========================================================================= */}
      {/* MOBILE / TABLET VIEWPORT LAYOUT (below lg) */}
      {/* ========================================================================= */}
      <div className="flex lg:hidden flex-col flex-1 min-h-0 h-full w-full gap-4 overflow-hidden">
        
        {/* Collapsible Video Player Section */}
        {lessonVideoUrl && (
          <div className="shrink-0 flex flex-col border border-border/60 bg-muted/10 rounded-xl overflow-hidden shadow-xs">
            <button
              type="button"
              onClick={() => setShowVideoMobile(!showVideoMobile)}
              className="flex items-center justify-between px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/20 transition-colors select-none"
            >
              <span className="flex items-center gap-1.5">
                📺 Video bài học
              </span>
              <span className="text-[10px] bg-background border border-border/60 px-1.5 py-0.5 rounded-md text-foreground">
                {showVideoMobile ? "Thu gọn ▴" : "Mở rộng ▾"}
              </span>
            </button>
            {showVideoMobile && (
              <div className="bg-black aspect-video w-full max-h-[160px] sm:max-h-[220px]">
                <video
                  ref={videoRefMobile}
                  className="w-full h-full object-contain"
                  controls
                  preload="metadata"
                  playsInline
                  onError={(event) => {
                    console.error("[QuizAIReviewer] Mobile video element error", {
                      error: event.currentTarget.error,
                      lessonVideoUrl,
                    });
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab Selection Switch */}
        <div className="flex rounded-xl bg-muted/40 p-1 border border-border/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTabMobile("active")}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
              activeTabMobile === "active"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Hoạt động</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-md font-bold">
              {activeQuestions.length}
            </Badge>
          </button>
          <button
            type="button"
            onClick={() => setActiveTabMobile("deleted")}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
              activeTabMobile === "deleted"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>Đã loại bỏ</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] rounded-md font-bold">
              {deletedQuestions.length}
            </Badge>
          </button>
        </div>

        {/* Scrollable Tab Lists */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeTabMobile === "active" ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Bulk Action Controls */}
              {activeQuestions.length > 0 && (
                <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl mb-3 border border-border/40 select-none shrink-0">
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer pl-1">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === activeQuestions.length && activeQuestions.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span>Chọn tất cả ({activeQuestions.length})</span>
                  </label>

                  {selectedIds.length > 0 && selectedIds.length < activeQuestions.length && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      className="h-8 rounded-lg text-xs font-bold gap-1.5 shadow-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Loại bỏ chưa chọn ({activeQuestions.length - selectedIds.length})
                    </Button>
                  )}
                </div>
              )}

              {/* Scrollable Active Question List */}
              <ScrollArea className="flex-1 pr-1">
                {activeQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    Không tìm thấy câu hỏi nào.
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {activeQuestions.map((q, idx) => renderActiveQuestionCard(q, idx))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Bulk Action Controls */}
              <div className="flex items-center justify-between mb-2 shrink-0 select-none px-1">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Câu hỏi đã loại bỏ ({deletedQuestions.length})
                </h4>
                {deletedQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreAll}
                    className="text-[11px] font-bold text-primary hover:underline"
                  >
                    Khôi phục tất cả
                  </button>
                )}
              </div>

              {deletedQuestions.length > 0 && (
                <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl mb-3 border border-border/40 select-none shrink-0">
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer pl-1">
                    <input
                      type="checkbox"
                      checked={selectedDeletedIds.length === deletedQuestions.length && deletedQuestions.length > 0}
                      onChange={toggleSelectAllDeleted}
                      className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <span>Chọn tất cả ({deletedQuestions.length})</span>
                  </label>

                  {selectedDeletedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkRestore}
                      className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 bg-background border border-border/60 py-1.5 px-3 rounded-lg shadow-2xs transition-colors"
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      Khôi phục ({selectedDeletedIds.length})
                    </button>
                  )}
                </div>
              )}

              {/* Scrollable Deleted Question List */}
              <ScrollArea className="flex-1 pr-1">
                {deletedQuestions.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground/80 py-8">Chưa loại bỏ câu nào.</p>
                ) : (
                  <div className="space-y-3 pb-4">
                    {deletedQuestions.map((q) => renderDeletedQuestionItem(q))}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Action Button Sticky Footer */}
        <div className="pt-2 border-t border-border/60 shrink-0">
          <Button
            onClick={handleSaveAndComplete}
            disabled={!canSaveQuiz}
            className="w-full h-11 rounded-xl font-bold shadow-md flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isSaving || filterMutation.isPending ? "Đang lưu..." : "Lưu quiz"}
          </Button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* DESKTOP VIEWPORT LAYOUT (lg and up) */}
      {/* ========================================================================= */}
      
      {/* Active Questions Panel (Left 3 columns) */}
      <div className="hidden lg:flex lg:col-span-3 flex-col min-h-0 h-full">
        {/* Header toolbar */}
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
              <h3 className="text-base font-bold text-foreground">Duyệt câu hỏi</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chọn các câu hỏi bạn muốn giữ lại. Những câu không được chọn sẽ bị loại bỏ.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/20">
            Sẽ lưu {selectedIds.length}/{activeQuestions.length + deletedQuestions.length}
          </Badge>
        </div>

        {/* Bulk select and delete bar */}
        {activeQuestions.length > 0 && (
          <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl mb-4 border border-border/40 select-none">
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground cursor-pointer pl-1">
              <input
                type="checkbox"
                checked={selectedIds.length === activeQuestions.length && activeQuestions.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
              />
              <span>Chọn tất cả ({activeQuestions.length})</span>
            </label>

            {selectedIds.length > 0 && selectedIds.length < activeQuestions.length && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-8 rounded-lg text-xs font-bold gap-1.5 shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Loại bỏ chưa chọn ({activeQuestions.length - selectedIds.length})
              </Button>
            )}
          </div>
        )}

        {/* Active list ScrollArea */}
        <ScrollArea className="flex-1 pr-3 min-h-[350px] lg:h-full">
          {activeQuestions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Không tìm thấy câu hỏi nào.
            </div>
          ) : (
            <div className="space-y-4">
              {activeQuestions.map((q, idx) => renderActiveQuestionCard(q, idx))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Video & Deleted Questions Panel (Right 2 columns) */}
      <div className="hidden lg:flex lg:col-span-2 flex-col gap-4 min-h-0 h-full">
        {/* Video Player */}
        {lessonVideoUrl ? (
          <div className="rounded-2xl border border-border bg-black overflow-hidden shadow-lg aspect-video shrink-0">
            <video
              ref={videoRefDesktop}
              className="w-full h-full object-contain"
              controls
              preload="metadata"
              playsInline
              onError={(event) => {
                console.error("[QuizAIReviewer] Desktop video element error", {
                  error: event.currentTarget.error,
                  lessonVideoUrl,
                });
              }}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground bg-muted/10 shrink-0">
            Bài học không có video xem trước.
          </div>
        )}

        {/* Deleted Drawer Section */}
        <div className="flex-1 flex flex-col min-h-[250px] lg:h-full border border-border/80 bg-muted/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2 select-none">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Câu hỏi đã loại bỏ ({deletedQuestions.length})
            </h4>
            {deletedQuestions.length > 0 && (
              <button
                type="button"
                onClick={handleRestoreAll}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Khôi phục tất cả
              </button>
            )}
          </div>

          {/* Bulk restore selection toolbar */}
          {deletedQuestions.length > 0 && (
            <div className="flex items-center justify-between bg-background border border-border/40 p-2 rounded-xl mb-3 select-none">
              <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground cursor-pointer pl-1">
                <input
                  type="checkbox"
                  checked={selectedDeletedIds.length === deletedQuestions.length && deletedQuestions.length > 0}
                  onChange={toggleSelectAllDeleted}
                  className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <span>Tất cả</span>
              </label>

              {selectedDeletedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkRestore}
                  className="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                >
                  <Undo2 className="h-3 w-3" />
                  Khôi phục ({selectedDeletedIds.length})
                </button>
              )}
            </div>
          )}

          {/* Deleted List ScrollArea */}
          <ScrollArea className="flex-1 min-h-[150px] lg:h-full">
            {deletedQuestions.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground/80 py-8">Chưa loại bỏ câu nào.</p>
            ) : (
              <div className="space-y-3">
                {deletedQuestions.map((q) => renderDeletedQuestionItem(q))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleSaveAndComplete}
          disabled={!canSaveQuiz}
          className="w-full h-11 rounded-xl font-bold shadow-md shrink-0 flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
              {isSaving || filterMutation.isPending ? "Đang lưu..." : "Lưu quiz"}
        </Button>
      </div>

    </div>
  );
}
