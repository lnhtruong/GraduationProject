import Image from "next/image";
import Link from "next/link";
import { ArrowBigDownDash, ArrowBigUpDash, ChevronRight, PanelLeftOpen, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NewsfeedOverlayHudProps {
	hudBaseOpacity: string;
	isCoursePanelOpen: boolean;
	userInitials: string;
	onOpenMenu: () => void;
	onToggleMenu: () => void;
	onPrev: () => void;
	onNext: () => void;
	onInteract: () => void;
}

export function NewsfeedOverlayHud({
	hudBaseOpacity,
	isCoursePanelOpen,
	userInitials,
	onOpenMenu,
	onToggleMenu,
	onPrev,
	onNext,
	onInteract,
}: NewsfeedOverlayHudProps) {
	return (
		<div
			className={cn(
				"pointer-events-none absolute inset-0 transition-all duration-500 ease-out z-20",
				isCoursePanelOpen ? "right-[min(42vw,520px)]" : "right-0",
			)}
		>
			<div
				className={cn(
					"absolute top-0 left-0 right-0 px-3 md:px-6 pt-2 md:pt-4 transition-opacity duration-300",
					hudBaseOpacity,
				)}
			>
				<div className="pointer-events-auto rounded-2xl bg-black/60 border border-white/10 backdrop-blur-md px-3 md:px-4 h-14 flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						className="text-white/90 hover:text-white hover:bg-white/10"
						onClick={onOpenMenu}
					>
						<PanelLeftOpen className="h-5 w-5" />
					</Button>

					<div className="hidden md:flex items-center gap-2 flex-1 max-w-sm">
						<Search className="h-4 w-4 text-white/60" />
						<Input
							placeholder="Tìm video, khóa học..."
							className="h-9 bg-white/5 border-white/10 text-white placeholder:text-white/50"
						/>
					</div>

					<div className="mx-auto">
						<Button asChild className="rounded-full px-6 font-semibold bg-white text-black hover:bg-white/90">
							<Link href="/">Về trang chủ</Link>
						</Button>
					</div>

					<div className="ml-auto flex items-center gap-2">
						<Avatar className="h-8 w-8 border border-white/20">
							<AvatarImage src={undefined} />
							<AvatarFallback className="text-xs bg-white/10 text-white">
								{userInitials}
							</AvatarFallback>
						</Avatar>
					</div>
				</div>
			</div>

			<div
				className={cn(
					"absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-3 transition-opacity",
					hudBaseOpacity,
				)}
			>
				<div className="relative h-32 md:h-40 w-12 flex items-center justify-center">
					<Image
						src="/logo.png"
						alt="LearnHub"
						width={52}
						height={52}
						className="rotate-90 opacity-80"
					/>
				</div>
				<Button
					size="icon"
					variant="ghost"
					onClick={onToggleMenu}
					className="pointer-events-auto h-10 w-10 rounded-full border border-white/20 text-white/90 bg-black/50 hover:bg-white/10 hover:text-white hover:scale-110 transition"
				>
					<ChevronRight className="h-5 w-5" />
				</Button>
			</div>

			<div className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3 pointer-events-auto">
				<Button
					size="icon"
					className="h-11 w-11 rounded-full bg-black/60 hover:bg-white/10 text-white border border-white/15"
					onClick={() => {
						onInteract();
						onPrev();
					}}
				>
					<ArrowBigUpDash className="h-5 w-5" />
				</Button>
				<Button
					size="icon"
					className="h-11 w-11 rounded-full bg-black/60 hover:bg-white/10 text-white border border-white/15"
					onClick={() => {
						onInteract();
						onNext();
					}}
				>
					<ArrowBigDownDash className="h-5 w-5" />
				</Button>
			</div>
		</div>
	);
}
