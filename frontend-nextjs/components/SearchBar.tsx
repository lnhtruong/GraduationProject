"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  // Sync with URL query parameter
  useEffect(() => {
    if (isInitialSync.current) {
      isInitialSync.current = false;
      return;
    }
    setQuery(initialQuery);
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
          className="h-10 w-full pl-4 pr-10 rounded-full border border-border bg-background/50 focus-visible:bg-background focus-visible:ring-primary/50 text-sm outline-none transition-all"
        />
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
    </form>
  );
}
