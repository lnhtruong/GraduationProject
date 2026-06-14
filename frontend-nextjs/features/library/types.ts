import type { Image } from "@/features/image";
import type { Video } from "@/features/video";

export type LibraryTabValue = "video" | "mascot" | "image" | "following";

export interface DeleteDialogState {
	tab: LibraryTabValue;
	id: number;
	label: string;
}

export type PreviewItem =
	| {
		kind: "video";
		item: Video;
		label: string;
	  }
	| {
		kind: "image";
		item: Image;
		label: string;
	  };

export type VideoTabValue = "video" | "mascot";

export const TAB_LABEL: Record<LibraryTabValue, string> = {
	video: "Video",
	mascot: "Mascot",
	image: "Hình ảnh",
	following: "Đang theo dõi",
};
