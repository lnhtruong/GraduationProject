"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCROLL_THRESHOLD = 260;

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > SCROLL_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 transition-all duration-200 sm:right-6 sm:bottom-6",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
      )}
      aria-hidden={!isVisible}
    >
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="pointer-events-auto h-9 w-9 rounded-full border border-border/70 bg-background/95 shadow-lg backdrop-blur hover:bg-background sm:h-10 sm:w-10"
        onClick={handleScrollTop}
        aria-label="Cuộn lên đầu trang"
        title="Cuộn lên đầu trang"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
