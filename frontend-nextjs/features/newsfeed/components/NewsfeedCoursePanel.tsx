import Link from "next/link";
import { ChevronRight, ChevronsRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { NewsfeedItem } from "../types";
import { getInitials } from "./newsfeed-ui";

function formatIsoDate(iso: string) {
	if (!iso) {
		return "-";
	}
	return iso.replace("T", " ").replace(".000Z", " UTC");
}

interface NewsfeedCoursePanelProps {
	video: NewsfeedItem;
	isOpen: boolean;
	onClose: () => void;
}

export function NewsfeedCoursePanel({ video, isOpen, onClose }: NewsfeedCoursePanelProps) {
	return (
		<div
			className={cn(
				"absolute right-0 top-0 h-full w-full max-w-[min(42vw,520px)] bg-background/95 text-foreground border-l border-border p-6 backdrop-blur-sm transition-transform duration-500",
				isOpen ? "translate-x-0" : "translate-x-full",
			)}
		>
			<Button
				type="button"
				variant="secondary"
				size="icon"
				onClick={onClose}
				className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-11 w-11 rounded-r-full rounded-l-none border border-border bg-card/95 shadow-md"
			>
				<ChevronsRight className="h-5 w-5" />
			</Button>

			<div className="h-full flex flex-col gap-5">
				<div className="flex items-center justify-between">
					<h3 className="text-xl font-bold">Thong tin khoa hoc</h3>
					<Button variant="ghost" size="icon" onClick={onClose}>
						<ChevronRight className="h-5 w-5" />
					</Button>
				</div>
				<div className="rounded-xl border border-border bg-card p-4 flex gap-4 items-start">
					<Avatar className="h-16 w-16 rounded-xl">
						<AvatarImage src={video.course.thumbnail ?? undefined} />
						<AvatarFallback className="rounded-xl bg-primary/10 text-primary font-semibold">
							{getInitials(video.course.name)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0 flex-1">
						<p className="font-semibold text-base truncate">{video.course.name}</p>
						<p className="text-sm text-muted-foreground">ID khoa hoc: {video.course.id}</p>
						<div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
							<span>{video.course.level}</span>
							<span>{video.course.duration}</span>
							<span>{video.course.language.toUpperCase()}</span>
						</div>
					</div>
				</div>
				<div className="rounded-xl border border-border p-4 space-y-3 bg-card">
					<p className="text-sm leading-6 text-muted-foreground">{video.course.description}</p>
					<div className="flex flex-wrap gap-2">
						{video.course.categories.map((tag) => (
							<span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary">
								#{tag}
							</span>
						))}
					</div>
				</div>
				<div className="grid grid-cols-2 gap-3 text-sm">
					<div className="rounded-xl border border-border p-3 bg-card">
						<p className="text-muted-foreground">Gia khoa hoc</p>
						<p className="font-semibold">{video.course.price.toLocaleString("vi-VN")} VND</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-card">
						<p className="text-muted-foreground">Ngon ngu</p>
						<p className="font-semibold uppercase">{video.course.language}</p>
					</div>
					<div className="rounded-xl border border-border p-3 bg-card col-span-2">
						<p className="text-muted-foreground">Thoi gian cap nhat</p>
						<p className="font-semibold">{formatIsoDate(video.course.updated_at)}</p>
					</div>
				</div>
				<Button className="mt-auto" asChild>
					<Link href="/courses">Kham pha khoa hoc day du</Link>
				</Button>
			</div>
		</div>
	);
}
