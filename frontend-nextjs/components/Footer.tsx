"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

import { useAuthState } from "@/features/auth/hooks/useAuth";
import { BRAND } from "@/lib/brand";

const productLinks = [
  { label: "Tìm khóa học", href: "/courses/search" },
  { label: "Bảng tin", href: "/newsfeed" },
  { label: "Tạo highlight", href: "/upload" },
  { label: "Trình chỉnh sửa", href: "/editor" },
];

const learnerLinks = [
  { label: "Khóa học của tôi", href: "/my-courses" },
  { label: "Khóa học đã lưu", href: "/wishlist" },
  { label: "Giỏ hàng", href: "/cart" },
];

const guestLinks = [
  { label: "Đăng nhập", href: "/signin" },
  { label: "Tạo tài khoản", href: "/signup" },
];

const legalLinks = [
  { label: "Chính sách quyền riêng tư", href: "/privacy" },
  { label: "Điều khoản dịch vụ", href: "/terms" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
        {title}
      </h3>
      <nav className="flex flex-col gap-2.5">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="w-fit text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function Footer() {
  const { isAuthenticated } = useAuthState();
  const visibleProductLinks = isAuthenticated
    ? productLinks
    : productLinks.filter((link) => link.href !== "/editor");
  const accountLinks = isAuthenticated ? learnerLinks : guestLinks;

  return (
    <footer className="border-t border-border/70 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_2fr]">
          <div className="max-w-sm">
            <Link href="/" className="flex w-fit items-center gap-3">
              <Image
                src={BRAND.logo}
                alt={BRAND.name}
                width={44}
                height={44}
                className="rounded-xl"
              />
              <div>
                <p className="text-lg font-black tracking-tight text-foreground">
                  {BRAND.name}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {BRAND.tagline}
                </p>
              </div>
            </Link>

            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              Video dài được rút gọn thành video ngắn nổi bật, chỉnh sửa trong trình
              biên tập và kết nối vào bảng tin, trắc nghiệm, khóa học theo một lộ
              trình học rõ ràng.
            </p>

            <Link
              href={`mailto:${BRAND.supportEmail}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              {BRAND.supportEmail}
            </Link>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <FooterColumn title="Sản phẩm" links={visibleProductLinks} />
            <FooterColumn
              title={isAuthenticated ? "Học tập" : "Tài khoản"}
              links={accountLinks}
            />
            <FooterColumn title="Pháp lý" links={legalLinks} />
          </div>
        </div>

        <div className="mt-10 border-t border-border/70 pt-6 text-center text-sm text-muted-foreground">
          <p>{BRAND.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
