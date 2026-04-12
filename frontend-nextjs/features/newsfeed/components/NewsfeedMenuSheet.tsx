import Image from "next/image";
import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { MENU_ITEMS } from "./newsfeed-ui";

interface NewsfeedMenuSheetProps {
	isOpen: boolean;
	onOpen: () => void;
	onClose: () => void;
}

export function NewsfeedMenuSheet({ isOpen, onOpen, onClose }: NewsfeedMenuSheetProps) {
	return (
		<Sheet open={isOpen} onOpenChange={(open) => (open ? onOpen() : onClose())}>
			<SheetContent side="left" className="w-[88%] sm:w-[360px] bg-background">
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						<Image src="/logo.png" alt="LearnHub" width={28} height={28} />
						LearnHub Menu
					</SheetTitle>
					<SheetDescription>
						Menu demo cho trang luot video. Sau nay co the doi sang menu thuc.
					</SheetDescription>
				</SheetHeader>
				<div className="px-4 pb-6 space-y-2">
					{MENU_ITEMS.map((item) => {
						const Icon = item.icon;
						return (
							<button
								key={item.id}
								type="button"
								className="w-full rounded-xl border border-border bg-card px-4 py-3 text-left flex items-center gap-3 hover:border-primary/50 hover:bg-primary/5 transition"
							>
								<Icon className="h-4 w-4 text-primary" />
								<span className="font-medium">{item.label}</span>
							</button>
						);
					})}
					<Button asChild className="w-full mt-3">
						<Link href="/">Ve trang chu</Link>
					</Button>
					<Button variant="outline" asChild className="w-full">
						<Link href="/courses">Kham pha khoa hoc</Link>
					</Button>
					<Button variant="ghost" asChild className="w-full">
						<Link href="/profile">
							<Info className="h-4 w-4" />
							Thong tin tai khoan
						</Link>
					</Button>
				</div>
			</SheetContent>
		</Sheet>
	);
}
