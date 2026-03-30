import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, Trash2 } from "lucide-react";
import type { Image } from "@/features/image";

interface ImageGridProps {
	items: Image[];
	isLoading: boolean;
	onPreview: (item: Image) => void;
	onDelete: (item: Image) => void;
}

export function ImageGrid({ items, isLoading, onPreview, onDelete }: ImageGridProps) {
	if (isLoading) {
		return <ImageGridSkeleton />;
	}

	if (items.length === 0) {
		return (
			<Empty className="min-h-[280px] border border-dashed border-border/70">
				<EmptyHeader>
					<EmptyTitle>Chưa có hình ảnh</EmptyTitle>
					<EmptyDescription>
						Dữ liệu sẽ hiển thị tại đây khi bạn tạo thêm trong trang editor.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
			{items.map((item) => (
				<Card key={item.id} className="group relative overflow-hidden border-border/70 py-0">
					<button
						type="button"
						onClick={() => onPreview(item)}
						className="w-full"
					>
						<div className="aspect-square w-full overflow-hidden bg-muted">
							{item.url ? (
								<div
									className="h-full w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-[1.04]"
									style={{ backgroundImage: `url(${item.thumbnail ?? item.url})` }}
								/>
							) : (
								<div className="flex h-full w-full items-center justify-center text-muted-foreground">
									<ImageIcon className="h-6 w-6" />
								</div>
							)}
						</div>
					</button>
					<Button
						size="icon"
						variant="secondary"
						className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
						onClick={() => onDelete(item)}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</Card>
			))}
		</div>
	);
}

function ImageGridSkeleton() {
	return (
		<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8">
			{Array.from({ length: 16 }).map((_, index) => (
				<Skeleton key={`image-grid-skeleton-${index}`} className="aspect-square w-full" />
			))}
		</div>
	);
}
