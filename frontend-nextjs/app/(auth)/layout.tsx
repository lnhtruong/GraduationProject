"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { PageLoader } from "@/components/PageLoader";
import AuthSlider from "@/components/AuthSlider";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-background overflow-hidden">
      {/* LEFT PANEL: Form & Branding */}
      <div className="flex w-full flex-col justify-center p-8 sm:p-12 lg:w-[50%] bg-gradient-to-br from-background to-muted/25 dark:from-slate-900 dark:to-slate-950 z-10 min-h-screen overflow-y-auto">
        {/* Middle: Auth Children with Centered Logo */}
        <div className="flex flex-col items-center justify-center py-12 max-w-sm mx-auto w-full">
          {/* Centered Logo */}
          <div className="mb-8">
            <Link href="/" className="flex flex-col items-center gap-2.5 group">
              <Image
                src="/logo.png"
                alt="LearnHub Logo"
                width={52}
                height={52}
                className="object-contain transition-transform group-hover:scale-105"
                priority
              />
              <span className="text-2xl font-bold text-primary tracking-tight font-display">
                LearnHub
              </span>
            </Link>
          </div>

          <div className="w-full">
            <Suspense fallback={<PageLoader />}>{children}</Suspense>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Brand Showcase & Interactive Slider Mockups */}
      <div className="hidden lg:flex lg:w-[50%] relative overflow-hidden flex-col justify-center p-12 bg-gradient-to-br from-muted/25 to-background dark:from-slate-950 dark:to-slate-900 border-l border-border/20">
        {/* Radial Glow in the background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px] dark:bg-primary/5" />
          <div className="absolute inset-0 bg-grid-slate-900/[0.02] dark:bg-grid-white/[0.01]" />
        </div>

        {/* Middle: Mockup Display with Motion Slider */}
        <AuthSlider />
      </div>
    </div>
  );
}

