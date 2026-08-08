import { BookOpen, GraduationCap, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ROLES, getRoleName } from "@/lib/roles";
import { cn } from "@/lib/utils";

function getRoleIcon(role: number) {
  switch (role) {
    case ROLES.ADMIN:
      return <ShieldCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />;
    case ROLES.LECTURER:
      return <BookOpen className="h-3 w-3 text-blue-500" />;
    default:
      return <GraduationCap className="h-3 w-3 text-muted-foreground" />;
  }
}

function getRoleBadgeClass(role: number): string {
  switch (role) {
    case ROLES.ADMIN:
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400";
    case ROLES.LECTURER:
      return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

interface RoleBadgeProps {
  role?: number;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const roleValue = role ?? 0;

  return (
    <Badge
      variant="outline"
      className={cn("min-w-0 gap-1 text-[10px] font-medium", getRoleBadgeClass(roleValue), className)}
    >
      <span className="shrink-0">{getRoleIcon(roleValue)}</span>
      <span className="min-w-0 truncate">{getRoleName(roleValue)}</span>
    </Badge>
  );
}
