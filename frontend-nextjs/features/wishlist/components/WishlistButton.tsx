"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuthState } from "@/features/auth/hooks/useAuth";
import { useIsInWishlist, useToggleWishlistMutation } from "../api/wishlist.hooks";

interface WishlistButtonProps {
  courseId: number;
  className?: string;
}

export function WishlistButton({ courseId, className }: WishlistButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthState();
  const inWishlist = useIsInWishlist(courseId);
  const { mutate: toggleWishlist, isPending } = useToggleWishlistMutation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/signin");
      return;
    }

    toggleWishlist(
      { courseId, currentlyInWishlist: inWishlist },
      {
        onSuccess: () => {
          if (inWishlist) {
            toast.success("Đã xóa khỏi danh sách lưu");
          } else {
            toast.success("Đã lưu khóa học", {
              description: "Xem tại Khóa học đã lưu",
              action: {
                label: "Xem ngay",
                onClick: () => router.push("/library/wishlist"),
              },
            });
          }
        },
      },
    );
  };

  return (
    <button
      type="button"
      aria-label={inWishlist ? "Xóa khỏi danh sách lưu" : "Lưu khóa học"}
      disabled={isPending}
      onClick={handleClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full",
        "bg-background/80 backdrop-blur-sm",
        "shadow-sm border border-border/40",
        "transition-all duration-200",
        "hover:scale-110 hover:bg-background",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors duration-200",
          inWishlist
            ? "fill-red-500 text-red-500"
            : "fill-none text-muted-foreground",
        )}
      />
    </button>
  );
}
