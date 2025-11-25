import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-foreground">
          Chào mừng đến với LearnHub
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Nền tảng AI xử lý video thông minh, giúp bạn tạo ra những video chất
          lượng cao một cách dễ dàng.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Bắt đầu ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
