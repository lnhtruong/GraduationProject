import { Card, CardContent } from "@/components/ui/card";
import { Video, Scissors, Upload, FileText, Play } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* 1. Hero Section - Clean & Minimal như GitHub */}
      <section className="relative py-24 lg:py-32 border-b border-border/50">
        <div className="container mx-auto px-4 text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
            Tự động hóa bài giảng
            <br />
            thành <span className="text-primary">video thông minh</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Biến bài giảng dài thành video ngắn hấp dẫn, tạo quiz tương tác và
            xây dựng thói quen học tập hiệu quả
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="text-lg px-8 py-3" asChild>
              <Link href="/upload" className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <span>Bắt đầu ngay</span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-3"
              asChild
            >
              <Link href="/courses" className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                <span>Tham khảo khóa học</span>
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">10K+</div>
              <div className="text-sm text-muted-foreground">
                Bài giảng đã xử lý
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">95%</div>
              <div className="text-sm text-muted-foreground">
                Độ chính xác AI
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">5 phút</div>
              <div className="text-sm text-muted-foreground">
                Thời gian xử lý
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features Section - Clean cards như Disney+ */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              3 công cụ AI mạnh mẽ giúp tối ưu hóa quá trình học tập và giảng
              dạy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Smart Video Clipping */}
            <Card className="border border-border bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Scissors className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Tạo clip thông minh
                </h3>
                <p className="text-muted-foreground mb-6">
                  Tự động cắt các điểm nhấn quan trọng từ bài giảng, tối ưu cho
                  social media và chia sẻ
                </p>
                <div className="text-sm text-primary font-medium">
                  Video Analysis AI
                </div>
              </CardContent>
            </Card>

            {/* Feature 2: Auto Content Generation */}
            <Card className="border border-border bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">Quiz & flashcard</h3>
                <p className="text-muted-foreground mb-6">
                  Tạo quiz và flashcard cá nhân hóa từ nội dung bài giảng để
                  tăng cường ghi nhớ
                </p>
                <div className="text-sm text-primary font-medium">
                  Natural Language Processing
                </div>
              </CardContent>
            </Card>

            {/* Feature 3: Avatar/Voice Generation */}
            <Card className="border border-border bg-card hover:bg-card/80 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">
                  Tạo avatar & giọng đọc
                </h3>
                <p className="text-muted-foreground mb-6">
                  Sinh video avatar và giọng đọc từ văn bản, giúp tạo nội dung
                  đa dạng và hấp dẫn
                </p>
                <div className="text-sm text-primary font-medium">
                  AI Voice & Avatar
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. How it works - Step by step như Indie Hackers */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Cách thức hoạt động
            </h2>
            <p className="text-xl text-muted-foreground">
              Chỉ 3 bước đơn giản để biến bài giảng thành video học tập hiệu quả
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Tải lên bài giảng</h3>
              <p className="text-muted-foreground">
                Upload file video, audio hoặc PDF của bài giảng lên hệ thống
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI xử lý tự động</h3>
              <p className="text-muted-foreground">
                AI phân tích nội dung, tạo clip, quiz và flashcard phù hợp
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Học tập hiệu quả</h3>
              <p className="text-muted-foreground">
                Nhận kết quả ngay lập tức và bắt đầu học tập với nội dung được
                tối ưu
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
