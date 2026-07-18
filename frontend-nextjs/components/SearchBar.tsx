"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceSearchDialog } from "@/features/voice-search/components/VoiceSearchDialog";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  searchPath?: string;
}

export function SearchBar({
  placeholder = "Tìm kiếm khóa học...",
  className,
  searchPath = "/courses/search",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const isInitialSync = useRef(true);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);

  useEffect(() => {
    if (isInitialSync.current) {
      isInitialSync.current = false;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setQuery(initialQuery);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [initialQuery]);

  const handleSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    router.push(`${searchPath}?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative flex w-full max-w-md items-center ${className ?? ""}`}>
      <div className="relative w-full">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-10 w-full rounded-full border border-border/70 bg-muted/50 pl-4 pr-24 text-sm shadow-sm outline-none transition-all focus-visible:border-primary focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-border/80 dark:bg-card/50 dark:focus-visible:border-primary/80 dark:focus-visible:bg-card dark:focus-visible:ring-primary/20"
        />
        {query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setQuery("");
            }}
            className="absolute right-[68px] top-1/2 h-7 w-7 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsVoiceSearchOpen(true)}
          className="absolute right-9 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          aria-label="Tìm bằng giọng nói"
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleSearch(query)}
          className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2 rounded-full text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          aria-label="Tìm kiếm"
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      <VoiceSearchDialog
        isOpen={isVoiceSearchOpen}
        onOpenChange={setIsVoiceSearchOpen}
        onSearch={(queryText) => {
          setQuery(queryText);
          handleSearch(queryText);
        }}
      />
    </form>
  );
}
