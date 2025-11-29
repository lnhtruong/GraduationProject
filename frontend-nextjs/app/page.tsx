import { Card, CardContent } from "@/components/ui/card";
import { Video, BookOpen, Scissors, Upload, FileText } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-primary">Học nhanh, Nhớ lâu</span>
            <br />
            <span className="text-foreground text-3xl md:text-4xl lg:text-5xl">
              Học tập gián đoạn được cá nhân hóa thông minh
            </span>
          </h1>{" "}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            Biến bài giảng dài thành <strong>video ngắn thông minh</strong>, tạo{" "}
            <strong>quiz tự động</strong>, và xây dựng
            <strong> thói quen học tập bền vững</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            {/* Primary CTA */}
            <Button
              size="lg"
              className="text-lg px-8 py-4 bg-linear-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              asChild
            >
              <Link href="/upload" className="flex items-center space-x-3">
                <Upload className="h-5 w-5" />
                <span>Tải lên Bài giảng ngay</span>
              </Link>
            </Button>

            {/* Secondary CTA */}
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-4 border-2 hover:bg-muted/50 transition-all duration-200"
              asChild
            >
              <Link href="/courses" className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5" />
                <span>Khám phá khóa học</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Smart Automation Section - Core của Đồ án */}
      <section className="py-20 bg-linear-to-r from-primary/5 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Tự động hóa Nội dung:
              <span className="text-primary"> Biến Bài giảng Dài</span>
              <br />
              thành{" "}
              <span className="text-secondary-foreground">
                Tài sản Học tập Đắt giá
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              3 chức năng cốt lõi giúp tối ưu hóa quá trình học tập và giảng dạy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1: Smart Video Clipping */}
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Scissors className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Tạo Clip Viral Hấp dẫn
                </h3>
                <p className="text-muted-foreground mb-6">
                  Tự động cắt các điểm nhấn quan trọng, tối ưu cho Social Media
                  và chia sẻ nhanh chóng
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-primary">
                  <Video className="h-4 w-4" />
                  <span>Video Analysis</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2: Auto Content Generation */}
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <FileText className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Học nhớ lâu hơn</h3>
                <p className="text-muted-foreground mb-6">
                  Tạo Quiz/Flashcard cá nhân hóa từ bài giảng để tăng cường ghi
                  nhớ và hiểu sâu
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-secondary-foreground">
                  <FileText className="h-4 w-4" />
                  <span>NLP + Learning Science</span>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3: Avatar/Voice Generation */}
            <Card className="relative overflow-hidden group hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Video className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Tạo Avatar/Video</h3>
                <p className="text-muted-foreground mb-6">
                  Hỗ trợ sinh <strong>giọng đọc/video</strong> từ prompt, giúp
                  giảng viên tạo nội dung đa dạng và hấp dẫn
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-accent-foreground">
                  <Video className="h-4 w-4" />
                  <span>Voice + Avatar</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
