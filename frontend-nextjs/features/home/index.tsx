"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Video, Scissors, Upload, FileText, Play, Zap } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* 1. Hero Section - Thêm hiệu ứng nền và Typography mạnh mẽ */}
      <section className="relative py-24 lg:py-32 overflow-hidden border-b border-border/40">
        {/* Background Gradients (Hiệu ứng nền loang màu) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-125 bg-primary/5 rounded-full blur-[100px] -z-10" />

        <div className="container mx-auto px-4 text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 tracking-tight text-foreground">
            Tự động hóa bài giảng <br className="hidden md:block" />
            thành{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-accent">
              video thông minh
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Biến bài giảng dài thành video ngắn hấp dẫn, tạo quiz tương tác và
            xây dựng thói quen học tập hiệu quả chỉ trong vài phút.
          </p>

          {/* CTA Buttons - Shadow & Hover Effect */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="text-lg h-12 px-8 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
              asChild
            >
              <Link href="/upload" className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                <span>Bắt đầu ngay</span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg h-12 px-8 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
              asChild
            >
              <Link href="/courses" className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                <span>Tham khảo khóa học</span>
              </Link>
            </Button>
          </div>

          {/* Stats - Đóng khung nổi bật */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto bg-card/50 backdrop-blur-sm border border-border/60 rounded-2xl p-8 shadow-sm">
            <div className="text-center group">
              <div className="text-3xl font-black text-foreground mb-1 group-hover:text-primary transition-colors">
                1,200+
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Bài giảng đã xử lý
              </div>
            </div>
            <div className="text-center group border-t md:border-t-0 md:border-l border-border/60 pt-6 md:pt-0">
              <div className="text-3xl font-black text-foreground mb-1 group-hover:text-primary transition-colors">
                80%
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Độ chính xác AI
              </div>
            </div>
            <div className="text-center group border-t md:border-t-0 md:border-l border-border/60 pt-6 md:pt-0">
              <div className="text-3xl font-black text-foreground mb-1 group-hover:text-primary transition-colors">
                10 phút
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Thời gian xử lý
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features Section - Card nổi bật với Hover */}
      <section className="py-24 bg-muted/40 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Tính năng nổi bật
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              3 công cụ AI mạnh mẽ giúp tối ưu hóa quá trình học tập và giảng
              dạy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="group relative overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <Scissors className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Tạo clip thông minh</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Tự động cắt các điểm nhấn quan trọng từ bài giảng, tối ưu cho
                  social media và chia sẻ.
                </p>
                <div className="inline-flex items-center text-sm font-semibold text-primary">
                  Video Analysis AI <Zap className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="group relative overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Quiz & Flashcard</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Tạo quiz và flashcard cá nhân hóa từ nội dung bài giảng để
                  tăng cường ghi nhớ sâu.
                </p>
                <div className="inline-flex items-center text-sm font-semibold text-primary">
                  NLP Engine <Zap className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="group relative overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <Video className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">Avatar & Giọng đọc</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Sinh video avatar và giọng đọc AI tự nhiên từ văn bản, giúp
                  tạo nội dung đa dạng.
                </p>
                <div className="inline-flex items-center text-sm font-semibold text-primary">
                  Generative AI <Zap className="ml-2 h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. How it works - Step by step nổi bật */}
      <section className="py-24 border-t border-border/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
              Cách thức hoạt động
            </h2>
            <p className="text-xl text-muted-foreground">
              Quy trình đơn giản, hiệu quả tức thì
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
            {/* Đường nối (chỉ hiện trên desktop) */}
            <div className="hidden md:block absolute top-10 left-[16%] right-[16%] h-0.5 bg-linear-to-r from-transparent via-primary/30 to-transparent -z-10" />

            {/* Step 1 */}
            <div className="text-center relative group">
              <div className="w-20 h-20 mx-auto bg-background border-4 border-muted group-hover:border-primary/50 rounded-full flex items-center justify-center mb-6 shadow-sm transition-colors duration-300 z-10 relative">
                <span className="text-3xl font-black text-muted-foreground group-hover:text-primary transition-colors">
                  1
                </span>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                Tải lên bài giảng
              </h3>
              <p className="text-muted-foreground px-4">
                Hỗ trợ mọi định dạng: Video, Audio, PDF. Kéo thả đơn giản và bảo
                mật.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center relative group">
              <div className="w-20 h-20 mx-auto bg-background border-4 border-muted group-hover:border-primary/50 rounded-full flex items-center justify-center mb-6 shadow-sm transition-colors duration-300 z-10 relative">
                <span className="text-3xl font-black text-muted-foreground group-hover:text-primary transition-colors">
                  2
                </span>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                AI Xử lý
              </h3>
              <p className="text-muted-foreground px-4">
                Hệ thống phân tích ngữ nghĩa, trích xuất keyframe và tạo câu hỏi
                trắc nghiệm.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center relative group">
              <div className="w-20 h-20 mx-auto bg-background border-4 border-muted group-hover:border-primary/50 rounded-full flex items-center justify-center mb-6 shadow-sm transition-colors duration-300 z-10 relative">
                <span className="text-3xl font-black text-muted-foreground group-hover:text-primary transition-colors">
                  3
                </span>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                Học tập & Chia sẻ
              </h3>
              <p className="text-muted-foreground px-4">
                Nhận video ngắn, flashcard và bắt đầu lộ trình học tập được cá
                nhân hóa.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
