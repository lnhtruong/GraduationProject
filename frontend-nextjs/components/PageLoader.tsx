interface PageLoaderProps {
  message?: string;
  className?: string;
}

export function PageLoader({
  message = "Đang tải...",
  className = "py-12",
}: PageLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 ${className}`}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
