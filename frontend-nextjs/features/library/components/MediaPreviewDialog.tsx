"use client";

import { useEffect, useRef, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { PreviewItem } from "../types";

interface MediaPreviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	preview: PreviewItem | null;
}

const SPEED_OPTIONS = ["0.5", "0.75", "1", "1.25", "1.5", "2"];

export function MediaPreviewDialog({
	open,
	onOpenChange,
	preview,
}: MediaPreviewDialogProps) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [speed, setSpeed] = useState("1");

	useEffect(() => {
		if (!open) {
			setSpeed("1");
		}
	}, [open]);

	useEffect(() => {
		if (!videoRef.current) return;
		videoRef.current.playbackRate = Number(speed);
	}, [speed]);

	if (!preview) return null;

	const description =
		preview.kind === "video"
			? `Loại: ${preview.item.type} · Tốc độ: ${speed}x`
			: "Xem trước hình ảnh";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[92vh] max-w-6xl overflow-hidden p-0">
				<DialogHeader className="border-b border-border/70 px-5 py-4">
					<div className="flex flex-wrap items-center justify-between gap-2">
						<div>
							<DialogTitle className="text-base">{preview.label}</DialogTitle>
							<DialogDescription>{description}</DialogDescription>
						</div>
						{preview.kind === "video" ? (
							<div className="flex items-center gap-2">
								<Label className="text-xs text-muted-foreground">Playback</Label>
								<Select value={speed} onValueChange={setSpeed}>
									<SelectTrigger className="h-8 w-[90px]">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SPEED_OPTIONS.map((value) => (
											<SelectItem key={value} value={value}>
												{value}x
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						) : (
							<Badge variant="secondary">Image Preview</Badge>
						)}
					</div>
				</DialogHeader>

				<div className="bg-black/85 p-3">
					{preview.kind === "video" ? (
						<video
							ref={videoRef}
							key={`${preview.item.id}-${preview.item.url}`}
							controls
							preload="metadata"
							className="mx-auto max-h-[72vh] w-full rounded-md bg-black"
						>
							<source src={preview.item.url} />
							Trình duyệt không hỗ trợ phát video.
						</video>
					) : (
						<img
							src={preview.item.url}
							alt={preview.label}
							className="mx-auto max-h-[72vh] w-auto rounded-md object-contain"
						/>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
