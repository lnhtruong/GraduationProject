"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";

interface Slide {
  title: string;
  description: string;
  renderMockup: () => React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    title: "Trích xuất khoảnh khắc",
    description: "Phân tích bài giảng và tự động cắt ghép các phân đoạn video ngắn (Highlights) cốt lõi.",
    renderMockup: () => (
      <div className="w-full rounded-2xl border border-border/80 bg-card/60 p-4 shadow-xl backdrop-blur-md relative overflow-hidden h-72 flex flex-col justify-between">
        {/* Window header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="text-[11px] text-muted-foreground font-mono select-none">
            trinh-bien-tap-video.app
          </div>
          <div className="w-12" />
        </div>

        {/* Timeline Editor Mockup */}
        <div className="rounded-xl bg-background border border-border p-3 flex flex-col justify-between flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-muted-foreground tracking-wider uppercase">
              Phân đoạn nổi bật
            </span>
            <span className="text-[9px] text-primary font-mono font-medium">Điểm Highlights: 95%</span>
          </div>

          {/* Mini Waves */}
          <div className="flex items-end justify-between h-14 px-1 gap-[3px] bg-muted/20 rounded-lg p-2 relative overflow-hidden">
            {[35, 50, 40, 65, 80, 55, 30, 45, 90, 100, 75, 40, 60, 85, 95, 60, 35, 50, 40].map((val, idx) => (
              <div 
                key={idx} 
                className={`w-full rounded-t-sm transition-all duration-300 ${idx >= 8 && idx <= 14 ? 'bg-primary' : 'bg-slate-400/30'}`} 
                style={{ height: `${val}%` }} 
              />
            ))}
            <div className="absolute inset-y-0 left-[45%] w-0.5 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] z-10" />
          </div>

          {/* Timeline Tracks */}
          <div className="space-y-1">
            <div className="h-5 rounded bg-card border border-border flex items-center px-2 relative overflow-hidden">
              <span className="text-[8px] text-muted-foreground z-10 font-mono">Bài giảng gốc.mp4</span>
              <div className="absolute top-0 bottom-0 left-12 w-28 bg-primary/10 border-l border-r border-primary/30" />
            </div>
            <div className="h-5 rounded bg-card border border-border flex items-center px-2 relative overflow-hidden">
              <span className="text-[8px] text-muted-foreground z-10 font-mono">Phụ đề tự động.srt</span>
              <div className="absolute top-0 bottom-0 left-12 w-28 bg-indigo-500/10 border-l border-r border-indigo-500/20" />
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Ôn tập kiến thức",
    description: "Tự động tạo câu hỏi trắc nghiệm ngắn dựa trên nội dung video để học viên ôn tập tức thì.",
    renderMockup: () => (
      <div className="w-full rounded-2xl border border-border/80 bg-card/60 p-4 shadow-xl backdrop-blur-md relative overflow-hidden h-72 flex flex-col justify-between">
        {/* Window header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="text-[11px] text-muted-foreground font-mono select-none">
            trac-nghiem-on-tap.app
          </div>
          <div className="w-12" />
        </div>

        {/* Quiz Mockup Card */}
        <div className="rounded-xl bg-background border border-border p-4 flex flex-col justify-between flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-primary tracking-wider uppercase flex items-center gap-1">
              <Brain className="h-3 w-3" /> Câu hỏi ôn tập nhanh
            </div>
            <span className="text-[9px] text-muted-foreground">Câu hỏi 1/3</span>
          </div>

          <div className="space-y-2.5 flex-1 justify-center flex flex-col">
            <div className="text-xs font-semibold text-foreground">
              Video ngắn giúp bạn ghi nhớ kiến thức hiệu quả thế nào?
            </div>
            <div className="space-y-1.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-[10px] text-foreground">
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                <span>Giúp tập trung hơn và dễ tiếp thu bài giảng</span>
              </div>
              <div className="p-2 rounded-lg bg-card border border-border flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="w-4 h-4 rounded-full border border-border flex items-center justify-center text-[9px] font-medium text-slate-400">B</span>
                <span>Giúp thư giãn sau giờ học lý thuyết</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-2 text-[9px]">
            <span className="text-emerald-500 font-medium">Đúng rồi! Cùng tiếp tục nhé</span>
            <span className="text-muted-foreground font-mono">Tiếp tục ➔</span>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "Học tập tương tác",
    description: "Đồng hành cùng Mascot AI giải đáp thắc mắc và tương tác trực quan ngay trong bài giảng.",
    renderMockup: () => (
      <div className="w-full rounded-2xl border border-border/80 bg-card/60 p-4 shadow-xl backdrop-blur-md relative overflow-hidden h-72 flex flex-col justify-between">
        {/* Window header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="text-[11px] text-muted-foreground font-mono select-none">
            lop-hoc-tuong-tac.app
          </div>
          <div className="w-12" />
        </div>

        {/* Video Player & Mascot View */}
        <div className="rounded-xl bg-background border border-border overflow-hidden relative flex flex-col justify-between flex-1">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
          
          <div className="p-3 z-10 flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[9px] bg-primary/10 text-primary border border-primary/20 font-medium">
              BÀI HỌC TRỰC TUYẾN
            </span>
            <span className="text-[9px] text-muted-foreground font-mono">01:45 / 04:20</span>
          </div>

          <div className="z-10 flex flex-col items-center justify-center space-y-3 flex-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-amber-400 p-0.5 animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-3xl">
                🤖
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-2xl bg-card/95 border border-border text-[10px] text-foreground max-w-[80%] text-center shadow-md leading-relaxed">
              "Chào bạn! Mình có thể giúp gì cho bạn trong bài giảng hôm nay?"
            </div>
          </div>

          <div className="p-2.5 z-10 bg-card border-t border-border text-center text-[10px] text-primary font-semibold flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Phụ đề bài giảng: Tự động dịch giọng nói sang văn bản...
          </div>
        </div>
      </div>
    )
  }
];

export default function AuthSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="z-10 flex flex-col items-center max-w-xl mx-auto my-auto space-y-8 w-full">
      <div className="h-32 flex flex-col items-center justify-center text-center space-y-3 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-3 w-full"
          >
            <h2 className="text-2xl font-bold text-foreground tracking-tight font-display">
              {SLIDES[currentSlide].title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
              {SLIDES[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Interactive Responsive Mockup Slide */}
      <div className="w-full relative h-72">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4 }}
            className="w-full absolute"
          >
            {SLIDES[currentSlide].renderMockup()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Navigation */}
      <div className="z-20 flex justify-center gap-1.5 pt-2">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
            aria-label={`Go to slide ${idx + 1}`}
          >
            <span className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === currentSlide 
                ? "w-6 bg-primary" 
                : "w-2.5 bg-slate-300 dark:bg-slate-700 group-hover:bg-slate-400 dark:group-hover:bg-slate-500"
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}
