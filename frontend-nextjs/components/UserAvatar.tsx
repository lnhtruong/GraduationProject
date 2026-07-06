import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  getUserAvatarUrl,
  getUserDisplayName,
  getUserInitials,
} from "@/lib/user-display";
import type { User } from "@/store/auth";

interface UserAvatarProps {
  user?: Partial<User> | null;
  fallback?: string;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  user,
  fallback = "U",
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const displayName = getUserDisplayName(user, fallback);
  const avatarUrl = getUserAvatarUrl(user);
  const initials = getUserInitials(user, fallback);

  return (
    <Avatar className={className}>
      <AvatarImage src={avatarUrl} alt={displayName} />
      <AvatarFallback
        className={cn("bg-primary/10 font-semibold text-primary", fallbackClassName)}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
