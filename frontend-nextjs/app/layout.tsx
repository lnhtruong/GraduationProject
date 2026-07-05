import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/providers/ThemeProvider";
import { QueryProvider } from "../components/providers/QueryProvider";
import { AuthProvider } from "../components/providers/AuthProvider";
import { Toaster } from "../components/ui/sonner";
import { ScrollToTopButton } from "../components/ScrollToTopButton";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  applicationName: "LearnHub",
  title: {
    template: "%s | LearnHub",
    default: "LearnHub - Nền tảng học tập qua video ngắn thông minh",
  },
  description: "Nền tảng học tập qua video ngắn và công cụ AI biên tập video, dựng khóa học tối ưu.",
  keywords: [
    "LearnHub",
    "hoc truc tuyen",
    "khoa hoc online",
    "video bai hoc ngan",
    "AI video editor",
    "lms",
  ],
  authors: [{ name: "LearnHub" }],
  creator: "LearnHub",
  publisher: "LearnHub",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "LearnHub",
    title: "LearnHub - Nền tảng học tập qua video ngắn thông minh",
    description: "Nền tảng học tập qua video ngắn và công cụ AI biên tập video, dựng khóa học tối ưu.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "LearnHub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LearnHub - Nền tảng học tập qua video ngắn thông minh",
    description: "Nền tảng học tập qua video ngắn và công cụ AI biên tập video, dựng khóa học tối ưu.",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider defaultTheme="system" storageKey="datn-theme">
            <AuthProvider>
              {children}
              <ScrollToTopButton />
              <Toaster richColors closeButton position="top-right" />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
