"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import { ThemeToggle } from "./ThemeToggle";
import Image from "next/image";

export function Header() {
  const [isDesktopSearchVisible, setIsDesktopSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDesktopSearchVisible && desktopSearchInputRef.current) {
      desktopSearchInputRef.current.focus();
    }
  }, [isDesktopSearchVisible]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        isScrolled
          ? "bg-background/95 backdrop-blur-sm border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6">
          <Image
            src="/logo.png"
            alt="Logo"
            width={32}
            height={32}
            className="rounded"
          />
          <span className="font-bold text-lg">LearnHub</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 mr-6">
          <Button variant="ghost" className="text-sm font-medium" asChild>
            <Link href="/">Trang chủ</Link>
          </Button>
          <Button variant="ghost" className="text-sm font-medium" asChild>
            <Link href="/upload">Upload</Link>
          </Button>
          <Button variant="ghost" className="text-sm font-medium" asChild>
            <Link href="/courses">Khóa học</Link>
          </Button>
          <Button variant="ghost" className="text-sm font-medium" asChild>
            <Link href="/editor">Editor</Link>
          </Button>
        </nav>

        {/* Search Bar - Center */}
        <div className="flex-1 max-w-md mx-auto hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm khóa học, video..."
              className="pl-10 pr-4 py-2 w-full bg-muted/50 border-0 focus:bg-background focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>
        </div>

        {/* Right Side - Auth & Theme */}
        <div className="flex items-center gap-2 ml-6">
          {/* Mobile Search */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsDesktopSearchVisible(!isDesktopSearchVisible)}
            aria-label="Toggle search"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Auth Buttons */}
          <Button variant="ghost" className="text-sm font-medium" asChild>
            <Link href="/auth/signin">Đăng nhập</Link>
          </Button>
          <Button className="text-sm font-medium" asChild>
            <Link href="/auth/signup">Đăng ký</Link>
          </Button>
        </div>

        {/* Mobile Search Overlay */}
        {isDesktopSearchVisible && (
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border p-4 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={desktopSearchInputRef}
                type="search"
                placeholder="Tìm kiếm khóa học, video..."
                className="pl-10 pr-10 py-2 w-full"
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2"
                onClick={() => setIsDesktopSearchVisible(false)}
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
