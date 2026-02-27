export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">403</h1>
        <h2 className="text-2xl font-semibold mb-2">Không có quyền truy cập</h2>
        <p className="text-muted-foreground mb-6">
          Bạn không có quyền truy cập trang này.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Về trang chủ
        </a>
      </div>
    </div>
  );
}
