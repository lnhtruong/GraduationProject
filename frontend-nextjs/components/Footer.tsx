"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

import { useAuthState } from "@/features/auth/hooks/useAuth";

const productLinks = [
  { label: "Tìm khóa học", href: "/courses/search" },
  { label: "Newsfeed", href: "/newsfeed" },
  { label: "Tạo Highlight", href: "/upload" },
  { label: "Editor", href: "/editor" },
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
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <nav className="mt-4 flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
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
                src="/logo.png"
                alt="LearnHub"
                width={44}
                height={44}
                className="rounded-xl"
              />
              <div>
                <p className="text-lg font-black tracking-tight text-foreground">
                  LearnHub
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  Học tập thông minh
                </p>
              </div>
            </Link>

            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              Nơi người học tìm khóa học, xem video ngắn và theo dõi lộ trình
              học tập rõ ràng hơn.
            </p>

            <Link
              href="mailto:support@learnhub.edu.vn"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Mail className="h-4 w-4" />
              support@learnhub.edu.vn
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
          <p>© 2026 LearnHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
