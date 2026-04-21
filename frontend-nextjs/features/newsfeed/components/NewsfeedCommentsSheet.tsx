"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2, MessageCircle, SendHorizonal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
	useCreateNewsfeedComment,
	useNewsfeedComments,
} from "../api/newsfeed.hooks";
import type { NewsfeedItem } from "../types";

function getCommentAuthorName(
	comment: {
		commenter?: { firstName?: string; lastName?: string };
	},
	fallbackName: string,
) {
	const firstName = comment.commenter?.firstName?.trim();
	const lastName = comment.commenter?.lastName?.trim();
	const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
	return fullName || fallbackName;
}

function getInitials(name: string) {
	const parts = name.trim().split(" ").filter(Boolean);
	if (!parts.length) {
		return "KH";
	}
	if (parts.length === 1) {
		return parts[0].slice(0, 2).toUpperCase();
	}
	return `${parts[0][0] ?? "K"}${parts[parts.length - 1][0] ?? "H"}`.toUpperCase();
}

function formatCommentDate(value: string) {
	if (!value) {
		return "vừa xong";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "vừa xong";
	}

	return date.toLocaleString("vi-VN", {
		hour: "2-digit",
		minute: "2-digit",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

interface NewsfeedCommentsSheetProps {
	isOpen: boolean;
	onClose: () => void;
	video: NewsfeedItem | null;
	viewerName: string;
}

export function NewsfeedCommentsSheet({
	isOpen,
	onClose,
	video,
	viewerName,
}: NewsfeedCommentsSheetProps) {
	const [content, setContent] = useState("");
	const feedId = video?.feedId ?? null;
	const commentsQuery = useNewsfeedComments(feedId, isOpen);
	const createCommentMutation = useCreateNewsfeedComment();

	const comments = useMemo(
		() => commentsQuery.data?.pages.flatMap((page) => page.items) ?? [],
		[commentsQuery.data?.pages],
	);

	const canSubmit =
		Boolean(feedId) &&
		content.trim().length > 0 &&
		content.trim().length <= 1000 &&
		!createCommentMutation.isPending;

	const submitComment = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!feedId || !canSubmit) {
			return;
		}

		const trimmed = content.trim();
		await createCommentMutation.mutateAsync({ feedId, content: trimmed });
		setContent("");
	};

	return (
		<Sheet open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
			<SheetContent side="right" className="w-[95vw] sm:w-[460px] p-0">
				<SheetHeader className="border-b border-border/70 px-5 py-4">
					<SheetTitle className="flex items-center gap-2">
						<MessageCircle className="h-5 w-5" />
						Bình luận
					</SheetTitle>
					<SheetDescription>
						{video ? `Video: ${video.title}` : "Chọn video để xem bình luận"}
					</SheetDescription>
				</SheetHeader>

				<ScrollArea className="h-[calc(100vh-190px)] px-5 py-4">
					<div className="space-y-4 pb-4">
						{comments.map((comment) => {
							const authorName = getCommentAuthorName(comment, "Người dùng");
							return (
								<div key={comment.id} className="rounded-xl border border-border/70 bg-card p-3">
									<div className="flex items-start gap-3">
										<Avatar className="h-9 w-9 border border-border/80">
											<AvatarFallback className="text-xs font-semibold">
												{getInitials(authorName)}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2 text-sm">
												<p className="font-semibold truncate">{authorName}</p>
												{comment.is_owner ? (
													<span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
														bạn
													</span>
												) : null}
											</div>
											<p className="mt-1 text-sm leading-6 text-foreground/95">{comment.content}</p>
											<p className="mt-2 text-xs text-muted-foreground">
												{formatCommentDate(comment.created_at)}
											</p>
										</div>
									</div>
								</div>
							);
						})}

						{commentsQuery.isLoading ? (
							<div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
								Đang tải bình luận...
							</div>
						) : null}

						{!commentsQuery.isLoading && comments.length === 0 ? (
							<div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
								Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ cảm nhận.
							</div>
						) : null}

						{commentsQuery.hasNextPage ? (
							<Button
								variant="outline"
								onClick={() => {
									void commentsQuery.fetchNextPage();
								}}
								disabled={commentsQuery.isFetchingNextPage}
								className="w-full"
							>
								{commentsQuery.isFetchingNextPage ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Đang tải thêm
									</>
								) : (
									"Tải thêm bình luận"
								)}
							</Button>
						) : null}
					</div>
				</ScrollArea>

				<form onSubmit={(event) => void submitComment(event)} className="border-t border-border/70 p-4">
					<div className="space-y-2">
						<Textarea
							value={content}
							onChange={(event) => setContent(event.target.value)}
							placeholder={`Bình luận với tư cách ${viewerName}...`}
							maxLength={1000}
							className="min-h-20 resize-none"
						/>
						<div className="flex items-center justify-between text-xs text-muted-foreground">
							<span>{content.trim().length}/1000</span>
							<Button type="submit" disabled={!canSubmit}>
								{createCommentMutation.isPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<SendHorizonal className="h-4 w-4" />
								)}
								Gửi
							</Button>
						</div>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}
