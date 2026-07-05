"use client";

import { useEffect } from "react";
import { Mic, MicOff, AlertCircle, RefreshCw } from "lucide-react";
import { useVoiceSearch } from "../hooks/useVoiceSearch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface VoiceSearchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => void;
}

export function VoiceSearchDialog({
  isOpen,
  onOpenChange,
  onSearch,
}: VoiceSearchDialogProps) {
  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceSearch({
    onEnd: (finalQuery) => {
      if (finalQuery.trim()) {
        // Auto-search and close when user stops speaking
        onSearch(finalQuery.trim());
        onOpenChange(false);
      }
    },
  });

  // Start listening automatically when dialog is opened
  useEffect(() => {
    if (isOpen && isSupported && !isListening && !error) {
      // Small timeout to allow the modal transition to complete smoothly
      const timer = setTimeout(() => {
        startListening();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isSupported, startListening, isListening, error]);

  // Clean up on close
  useEffect(() => {
    if (!isOpen && isListening) {
      stopListening();
    }
  }, [isOpen, isListening, stopListening]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-8 flex flex-col items-center gap-6" showCloseButton={true}>
        <DialogHeader className="w-full text-center">
          <DialogTitle className="text-xl font-bold tracking-wide">
            Tìm kiếm bằng giọng nói
          </DialogTitle>
        </DialogHeader>

        {!isSupported ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 animate-bounce" />
            <p className="text-sm text-muted-foreground font-medium">
              Trình duyệt của bạn không hỗ trợ tính năng này.
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Vui lòng sử dụng Google Chrome, Microsoft Edge hoặc các trình duyệt nhân Chromium hiện đại khác.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full gap-8 py-4">
            {/* Pulsing Mic Button Wrapper */}
            <div className="relative flex items-center justify-center h-40 w-40">
              {isListening && (
                <>
                  <span className="absolute inline-flex h-24 w-24 animate-ping rounded-full bg-red-500/25 opacity-75" />
                  <span className="absolute inline-flex h-32 w-32 animate-pulse rounded-full bg-red-500/10" />
                  <span className="absolute inline-flex h-40 w-40 rounded-full bg-red-500/5 animate-pulse" style={{ animationDuration: '2.5s' }} />
                </>
              )}

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleMicClick}
                className={`h-20 w-20 rounded-full border-2 shadow-lg transition-all duration-300 z-10 ${
                  isListening
                    ? "bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600 scale-105"
                    : error
                    ? "bg-yellow-500 border-yellow-500 text-white hover:bg-yellow-600 hover:border-yellow-600"
                    : "bg-background border-primary/20 text-primary hover:bg-primary/5"
                }`}
              >
                {isListening ? (
                  <Mic className="h-8 w-8 animate-pulse" />
                ) : (
                  <MicOff className="h-8 w-8" />
                )}
              </Button>
            </div>

            {/* Live Transcript Display */}
            <div className="w-full text-center min-h-[4rem] px-4 flex flex-col justify-center">
              {error ? (
                <div className="flex flex-col items-center gap-2 px-4 max-w-sm">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 font-semibold leading-relaxed">
                    {error}
                  </p>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Mẹo: Hãy chắc chắn micro không bị tắt tiếng và thiết bị thu âm đúng được chọn trong cài đặt Chrome.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startListening}
                    className="mt-3 text-xs font-semibold gap-1 border-primary/25 text-primary hover:bg-primary/5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Thử lại
                  </Button>
                </div>
              ) : (
                <p
                  className={`text-lg transition-all duration-300 ${
                    transcript
                      ? "text-foreground font-semibold leading-relaxed"
                      : "text-muted-foreground/60 italic"
                  }`}
                >
                  {transcript || (isListening ? "Đang lắng nghe..." : "Nhấp vào micrô để nói")}
                </p>
              )}
            </div>

            {/* Instruction tooltip */}
            <p className="text-xs text-muted-foreground/80 tracking-wide font-medium">
              {isListening
                ? "Nói để tìm kiếm bài học, khóa học"
                : error
                ? "Bấm thử lại để khởi động lại micro"
                : "Bấm vào mic để bắt đầu nói"}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
