import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonVideoUpNextOverlayProps {
  showUpNextOverlay: boolean;
  nextLessonTitle?: string;
  selectedLessonDuration: number;
  currentTime: number;
  onAdvanceToNextLesson: () => void;
  isTransitioningNext: boolean;
}

export function LessonVideoUpNextOverlay({
  showUpNextOverlay,
  nextLessonTitle,
  selectedLessonDuration,
  currentTime,
  onAdvanceToNextLesson,
  isTransitioningNext,
}: LessonVideoUpNextOverlayProps) {
  return (
    <>
      {/* Up Next Countdown Overlay */}
      <AnimatePresence>
        {showUpNextOverlay && nextLessonTitle ? (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            className="absolute bottom-16 right-6 z-50 w-65 rounded-xl border border-white/10 bg-black/70 p-3 text-white backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-20 shrink-0 rounded-md bg-white/6" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">Tiếp theo: {nextLessonTitle}</p>
                <p className="mt-1 text-xs text-white/70">
                  Bắt đầu sau {Math.max(0, Math.ceil(selectedLessonDuration - currentTime))}s
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <Button size="sm" onClick={onAdvanceToNextLesson} className="bg-white/10 text-white">
                Chuyển ngay
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Transitioning Loading Overlay */}
      <AnimatePresence>
        {isTransitioningNext && nextLessonTitle ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white backdrop-blur-sm"
          >
            <Sparkles className="mb-4 h-12 w-12 animate-pulse text-primary" />
            <h3 className="mb-1 text-xl font-semibold">Đã hoàn thành!</h3>
            <p className="flex items-center gap-2 text-sm text-white/85">
              Đang chuyển sang:
              <span className="font-medium text-white">{nextLessonTitle}</span>
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
