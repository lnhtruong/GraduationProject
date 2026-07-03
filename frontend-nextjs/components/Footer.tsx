import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo và Bản quyền */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">LearnHub</h3>
            <p className="text-sm text-muted-foreground">
              Nền tảng học tập thông minh với AI
            </p>
            <p className="text-xs text-muted-foreground">
              © 2025 LearnHub. All rights reserved.
            </p>
          </div>

          {/* Sản phẩm */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Sản phẩm</h4>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/upload"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Tạo Short/Highlight
              </Link>
              <Link
                href="/courses"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Khám phá Khóa học
              </Link>
              <Link
                href="/editor"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Công cụ Editor
              </Link>
            </nav>
          </div>

          {/* Công ty */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Công ty</h4>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/about"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Giới thiệu
              </Link>
              <Link
                href="/terms"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Điều khoản
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Chính sách bảo mật
              </Link>
            </nav>
          </div>

          {/* Liên hệ */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Liên hệ</h4>
            <nav className="flex flex-col space-y-2">
              <Link
                href="/support"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Hỗ trợ
              </Link>
              <Link
                href="mailto:support@learnhub.edu.vn"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Email
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
