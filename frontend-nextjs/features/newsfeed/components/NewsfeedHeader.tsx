"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Mic, Search, User, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { VoiceSearchDialog } from "@/features/voice-search/components/VoiceSearchDialog";
import { getUserDisplayName } from "@/lib/user-display";
import type { User as AuthUser } from "@/store/auth";

interface NewsfeedHeaderProps {
  onToggleMenu: () => void;
  isAuthenticated: boolean;
  user?: AuthUser | null;
  onLogout: () => void | Promise<void>;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
}

export function NewsfeedHeader({
  onToggleMenu,
  isAuthenticated,
  user,
  onLogout,
  searchValue,
  onSearchValueChange,
  onSearchSubmit,
}: NewsfeedHeaderProps) {
  const pathname = usePathname();
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const userName = getUserDisplayName(user);

  const handleSubmit = (value: string) => {
    onSearchSubmit(value);
    setIsMobileSearchOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="grid h-full w-full grid-cols-[auto_1fr_auto] items-center gap-3 pl-3 pr-3 sm:pr-4 lg:pr-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Mở hoặc thu gọn menu"
            onClick={onToggleMenu}
            className="h-10 w-10 rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <BrandLogo compact />
        </div>

        <div className="hidden justify-self-center md:flex md:w-full md:max-w-[760px] items-center gap-3">
          <form
            className="flex h-12 flex-1 items-center gap-2 overflow-hidden rounded-full border border-border/70 bg-muted/75 pl-4 pr-0 shadow-sm transition-colors focus-within:border-primary/40 focus-within:bg-background"
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit(searchValue);
            }}
          >
            <Search className="h-4 w-4 flex-none text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm"
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              className="h-9 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
            {searchValue && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSearchValueChange("");
                }}
                className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                aria-label="Xóa tìm kiếm"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="Tìm kiếm"
              className="h-full w-12 rounded-l-none rounded-r-full border-l border-border/60 text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
            >
              <Search className="h-5 w-5" />
            </Button>
          </form>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Tìm bằng giọng nói"
            onClick={() => setIsVoiceSearchOpen(true)}
            className="h-12 w-12 shrink-0 rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <Button
            variant="ghost"
            size="icon"
            aria-label={isMobileSearchOpen ? "Đóng tìm kiếm" : "Mở tìm kiếm"}
            onClick={() => setIsMobileSearchOpen((open) => !open)}
            className="inline-flex h-10 w-10 rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground md:hidden"
          >
            {isMobileSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tìm bằng giọng nói"
            onClick={() => setIsVoiceSearchOpen(true)}
            className="inline-flex h-10 w-10 rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground md:hidden"
          >
            <Mic className="h-5 w-5" />
          </Button>
          <ThemeToggle />

          <VoiceSearchDialog
            isOpen={isVoiceSearchOpen}
            onOpenChange={setIsVoiceSearchOpen}
            onSearch={(query) => {
              onSearchValueChange(query);
              handleSubmit(query);
            }}
          />

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
                >
                  <UserAvatar
                    user={user}
                    className="h-8 w-8"
                    fallbackClassName="text-xs"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>{userName}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Hồ sơ</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void onLogout();
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              className="h-9 w-9 shrink-0 overflow-hidden rounded-full p-0 font-bold sm:h-10 sm:w-auto sm:px-5"
            >
              <Link
                href={`/signin?returnUrl=${encodeURIComponent(pathname)}`}
                aria-label="Đăng nhập"
                className="flex items-center gap-1.5 overflow-hidden sm:overflow-visible"
              >
                <User className="h-4 w-4" />
                <span className="max-[420px]:sr-only">Đăng nhập</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isMobileSearchOpen && (
        <form
          className="absolute left-3 right-3 top-[calc(100%+0.5rem)] flex h-12 items-center gap-2 rounded-2xl border border-border/70 bg-background p-2 shadow-lg md:hidden"
          onSubmit={(event) => {
            event.preventDefault();
            handleSubmit(searchValue);
          }}
        >
          <Search className="h-4 w-4 flex-none text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Tìm video, khóa học..."
            value={searchValue}
            onChange={(event) => onSearchValueChange(event.target.value)}
            className="h-8 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
          />
          {searchValue && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Xóa tìm kiếm"
              onClick={() => onSearchValueChange("")}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button type="submit" size="sm" className="h-8 rounded-xl px-3">
            Tìm
          </Button>
        </form>
      )}
    </header>
  );
}
