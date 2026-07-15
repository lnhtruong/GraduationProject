"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Mic, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { VoiceSearchDialog } from "@/features/voice-search/components/VoiceSearchDialog";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
}

export function SearchBar({ placeholder = "Tìm kiếm khóa học...", className }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebounce(query, 300);
  const isInitialSync = useRef(true);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);

  // Sync with URL query parameter
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

    router.push(`/courses/search?q=${encodeURIComponent(trimmed)}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleIconClick = () => {
    handleSearch(query);
  };

  return (
    <form onSubmit={onSubmit} className={`relative flex items-center w-full max-w-md ${className}`}>
      <div className="relative w-full">
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 w-full pl-4 pr-24 rounded-full border border-border/70 dark:border-border/80 bg-muted/50 dark:bg-card/50 shadow-sm focus-visible:bg-background dark:focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30 dark:focus-visible:ring-primary/20 focus-visible:border-primary dark:focus-visible:border-primary/80 text-sm outline-none transition-all"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuery("");
            }}
            className="absolute right-[68px] top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
            aria-label="Xóa tìm kiếm"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsVoiceSearchOpen(true)}
          className="absolute right-9 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80"
          aria-label="Tìm bằng giọng nói"
        >
          <Mic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleIconClick}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80"
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
