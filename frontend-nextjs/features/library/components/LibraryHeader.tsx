import { Button } from "@/components/ui/button";
import { Plus, Sparkles } from "lucide-react";

interface LibraryHeaderProps {
	totalCount: number;
	onOpenEditor: () => void;
	onRefresh: () => void;
}

export function LibraryHeader({
	totalCount,
	onOpenEditor,
	onRefresh,
}: LibraryHeaderProps) {
	return (
		<div className="rounded-xl border border-border/80 bg-card p-4 shadow-sm">
			<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div className="space-y-1.5">
					<p className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
						<Sparkles className="h-3 w-3" />
						Kho media cá nhân
					</p>
					<h1 className="text-xl font-bold tracking-tight md:text-2xl">
						Library của bạn
					</h1>
					<p className="text-xs text-muted-foreground md:text-sm">
						Tổng cộng {totalCount} tệp. Bạn có thể xem nhanh, tua video và quản lý
						xóa trực tiếp tại đây.
					</p>
				</div>

				<div className="flex items-center gap-2">
					<Button
						size="sm"
						onClick={onOpenEditor}
						className="h-9 px-4 text-sm shadow-md shadow-primary/25"
					>
						<Plus className="mr-1.5 h-4 w-4" />
						Mở Editor để tạo mới
					</Button>
				</div>
			</div>
		</div>
	);
}
