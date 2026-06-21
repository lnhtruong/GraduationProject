"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Mic, Search, Settings, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { VoiceSearchDialog } from "@/features/voice-search/components/VoiceSearchDialog";

interface NewsfeedHeaderProps {
  onToggleMenu: () => void;
  isAuthenticated: boolean;
  userInitials: string;
  userName?: string | null;
  onLogout: () => void | Promise<void>;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
}

export function NewsfeedHeader({
  onToggleMenu,
  isAuthenticated,
  userInitials,
  userName,
  onLogout,
  searchValue,
  onSearchValueChange,
  onSearchSubmit,
}: NewsfeedHeaderProps) {
  const router = useRouter();
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);

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
          <Link href="/" className="flex items-center gap-2 rounded-full px-1.5 py-1">
            <Image src="/logo.png" alt="LearnHub" width={28} height={28} />
            <span className="hidden text-sm font-semibold tracking-wide sm:inline">
              LearnHub
            </span>
          </Link>
        </div>

        <div className="hidden justify-self-center md:flex md:w-full md:max-w-[760px] items-center gap-3">
          <form
            className="flex h-12 flex-1 items-center gap-2 overflow-hidden rounded-full border border-border/70 bg-muted/75 pl-4 pr-0 shadow-sm transition-colors focus-within:border-primary/40 focus-within:bg-background"
            onSubmit={(event) => {
              event.preventDefault();
              onSearchSubmit(searchValue);
            }}
          >
            <Search className="h-4 w-4 flex-none text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm"
              value={searchValue}
              onChange={(event) => onSearchValueChange(event.target.value)}
              className="h-9 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <Button
              type="submit"
              variant="secondary"
              size="icon"
              aria-label="Tìm kiếm"
              className="h-full w-12 rounded-r-full rounded-l-none border-l border-border/60 bg-foreground text-background hover:bg-foreground/90 transition-colors"
            >
              <Search className="h-5 w-5" />
            </Button>
          </form>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Tìm bằng giọng nói"
            onClick={() => setIsVoiceSearchOpen(true)}
            className="h-12 w-12 rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground shrink-0 cursor-pointer"
          >
            <Mic className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tìm bằng giọng nói"
            onClick={() => setIsVoiceSearchOpen(true)}
            className="inline-flex md:hidden h-10 w-10 rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
          >
            <Mic className="h-5 w-5" />
          </Button>
          <ThemeToggle />

          <VoiceSearchDialog
            isOpen={isVoiceSearchOpen}
            onOpenChange={setIsVoiceSearchOpen}
            onSearch={(query) => {
              onSearchValueChange(query);
              onSearchSubmit(query);
            }}
          />
          {isAuthenticated ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={undefined} />
                      <AvatarFallback className="text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    {userName ? userName : "Tài khoản"}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Cài đặt</span>
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
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden rounded-full border border-border/70 bg-background/90 px-4 shadow-sm hover:bg-accent hover:text-accent-foreground sm:inline-flex"
              >
                <Link href="/signin">Đăng nhập</Link>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                asChild
                className="rounded-full px-4 shadow-sm"
              >
                <Link href="/signup">Đăng ký</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
