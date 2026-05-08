"use client";

import Image from "next/image";
import Link from "next/link";
import { Keyboard, Menu, Mic, Search, Settings, User } from "lucide-react";
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

interface NewsfeedHeaderProps {
  onToggleMenu: () => void;
  userInitials: string;
  userName?: string | null;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
}

export function NewsfeedHeader({
  onToggleMenu,
  userInitials,
  userName,
  searchValue,
  onSearchValueChange,
  onSearchSubmit,
}: NewsfeedHeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 h-16 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
      <div className="grid h-full w-full grid-cols-[auto_1fr_auto] items-center gap-3 px-3 sm:px-4 lg:px-6">
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

        <div className="hidden justify-self-center md:flex md:w-full md:max-w-[760px]">
          <form
            className="flex h-12 w-full items-center gap-2 rounded-full border border-border/70 bg-muted/75 px-2 pl-4 shadow-sm transition-colors focus-within:border-primary/40 focus-within:bg-background"
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
              variant="ghost"
              size="icon"
              aria-label="Nhập bằng bàn phím"
              className="h-9 w-9 rounded-full bg-background/80 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="icon"
              aria-label="Tìm kiếm"
              className="h-12 w-12 rounded-r-full rounded-l-none border-l border-border/60 bg-foreground text-background hover:bg-foreground/90"
            >
              <Search className="h-5 w-5" />
            </Button>
          </form>
        </div>

        <div className="flex items-center gap-2 justify-self-end">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tìm bằng giọng nói"
            className="h-10 w-10 rounded-full border border-border/70 bg-background/90 text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            <Mic className="h-5 w-5" />
          </Button>
          <ThemeToggle />
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
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />Hồ sơ
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />Cài đặt
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Đăng xuất</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
