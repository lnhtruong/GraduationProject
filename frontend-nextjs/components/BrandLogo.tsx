import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  href?: string;
  subtitle?: string;
  badge?: string;
  compact?: boolean;
  className?: string;
}

export function BrandLogo({
  href = "/",
  subtitle = BRAND.tagline,
  badge,
  compact = false,
  className,
}: BrandLogoProps) {
  const logoHeight = compact ? 32 : 40;
  const logoWidth = Math.round((logoHeight * 227) / 240);

  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-xl px-1 py-1.5 transition-colors hover:bg-muted/60",
        className,
      )}
    >
      <Image
        src={BRAND.logo}
        alt={BRAND.name}
        width={227}
        height={240}
        priority
        className="rounded-xl object-contain"
        style={{ width: logoWidth, height: logoHeight }}
      />
      <div className={cn("leading-tight", compact ? "hidden sm:block" : "hidden sm:block")}>
        <div className="flex items-center gap-2">
          <p className="text-base font-extrabold tracking-tight text-foreground">
            {BRAND.name}
          </p>
          {badge ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              {badge}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="text-[11px] font-medium text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
