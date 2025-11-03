"use client";

import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const [isDesktopSearchVisible, setIsDesktopSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDesktopSearchVisible && desktopSearchInputRef.current) {
      desktopSearchInputRef.current.focus();
    }
  }, [isDesktopSearchVisible]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-accent shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo and Title */}
        <Link to="/" className="flex items-center gap-2 mr-6">
          <img
            src="/logo.png"
            alt="Logo"
            width={40}
            height={40}
            className="rounded"
          />
          <span
            className={cn(
              "font-bold",
              isDesktopSearchVisible
                ? "hidden sm:inline-block"
                : "hidden sm:inline-block"
            )}
          >
            LearnHub
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav
          className={cn(
            "items-center gap-4 lg:gap-6",
            isDesktopSearchVisible ? "hidden" : "hidden md:flex"
          )}
        >
          <Button variant="ghost" asChild>
            <Link to="/">Home</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/upload">Video AI</Link>
          </Button>
        </nav>

        {/* Right Side Controls */}
        <div className={cn("flex flex-1 items-center justify-end gap-2")}>
          {/* Desktop Search Form */}
          {isDesktopSearchVisible && (
            <form className="hidden md:flex flex-1 items-center gap-1 max-w-sm lg:max-w-md ml-auto">
              <Input
                ref={desktopSearchInputRef}
                type="search"
                placeholder="Tìm kiếm mọi thứ..."
                className="h-9 flex-1 bg-background text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Tìm kiếm"
              />
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Submit search"
              >
                <Search className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsDesktopSearchVisible(false)}
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </Button>
            </form>
          )}

          {!isDesktopSearchVisible && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:inline-flex"
              onClick={() => setIsDesktopSearchVisible(true)}
              aria-label="Toggle search"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          <div
            className={cn(isDesktopSearchVisible ? "hidden md:flex" : "flex")}
          >
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
