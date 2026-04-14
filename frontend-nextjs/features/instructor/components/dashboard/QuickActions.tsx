import Link from "next/link";
import { BookOpen, Video, MessageSquare } from "lucide-react";

const ACTIONS = [
  {
    icon: BookOpen,
    title: "Tạo khóa học mới",
    description: "Xây dựng lộ trình học với video, quiz và bài tập thực hành.",
    href: "/instructor/courses/new",
    cta: "Get started →",
  },
  {
    icon: Video,
    title: "Upload Short Video",
    description: "Đăng clip giáo dục ngắn trực tiếp vào feed của học viên.",
    href: "/upload",
    cta: "Get started →",
  },
  {
    icon: MessageSquare,
    title: "Trả lời Q&A",
    description: "Tương tác với học viên và tăng điểm engagement của khóa học.",
    href: "/instructor/qa",
    cta: "Get started →",
  },
];

export function QuickActions() {
  return (
    <div>
      <h2 className="mb-4 text-base font-semibold text-foreground">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group rounded-xl border border-border/60 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-md"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <action.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-foreground">
              {action.title}
            </h3>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              {action.description}
            </p>
            <span className="text-sm font-medium text-primary">{action.cta}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
