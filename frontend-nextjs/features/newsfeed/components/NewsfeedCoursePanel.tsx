import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { NewsfeedItem } from "../types";
import { getInitials } from "./newsfeed-ui";

function formatIsoDate(iso: string) {
	if (!iso) {
		return "Không rõ";
	}
	return iso.replace("T", " ").replace(".000Z", " UTC");
}

interface NewsfeedCoursePanelProps {
	video: NewsfeedItem;
	onClose?: () => void;
}

export function NewsfeedCoursePanel({ video, onClose }: NewsfeedCoursePanelProps) {
	return (
		<div className="flex h-full flex-col gap-5">
			<div className="flex items-center justify-between">
				<h3 className="text-xl font-bold">Thông tin khóa học</h3>
				{onClose ? (
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="h-10 w-10 rounded-full border border-border/70 bg-background/90 hover:bg-accent"
					>
						<ChevronRight className="h-5 w-5" />
					</Button>
				) : null}
			</div>
			<div className="flex items-start gap-4 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
				<Avatar className="h-16 w-16 rounded-2xl">
					<AvatarImage src={video.course.thumbnail ?? undefined} />
					<AvatarFallback className="rounded-2xl bg-primary/10 text-primary font-semibold">
						{getInitials(video.course.name)}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0 flex-1">
					<p className="truncate text-base font-semibold">{video.course.name}</p>
					<p className="text-sm text-muted-foreground">ID khóa học: {video.course.id}</p>
					<div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
						<span>{video.course.level}</span>
						<span>{video.course.duration}</span>
						<span>{video.course.language.toUpperCase()}</span>
					</div>
				</div>
			</div>
			<div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
				<p className="text-sm leading-6 text-muted-foreground">{video.course.description}</p>
				<div className="flex flex-wrap gap-2">
					{video.course.categories.map((tag) => (
						<span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
							#{tag}
						</span>
					))}
				</div>
			</div>
			<div className="grid grid-cols-2 gap-3 text-sm">
				<div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
					<p className="text-muted-foreground">Giá khóa học</p>
					<p className="font-semibold">{video.course.price.toLocaleString("vi-VN")} VND</p>
				</div>
				<div className="rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
					<p className="text-muted-foreground">Ngôn ngữ</p>
					<p className="font-semibold uppercase">{video.course.language}</p>
				</div>
				<div className="col-span-2 rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
					<p className="text-muted-foreground">Thời gian cập nhật</p>
					<p className="font-semibold">{formatIsoDate(video.course.updated_at)}</p>
				</div>
			</div>
			<Button className="mt-auto h-11 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
				<Link href="/courses">Khám phá khóa học đầy đủ</Link>
			</Button>
		</div>
	);
}
