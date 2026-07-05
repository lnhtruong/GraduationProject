import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Video đã lưu",
  "Xem lại các video bài học ngắn bạn đã lưu trên LearnHub.",
);

import { NewsfeedCollectionPage } from "@/features/newsfeed/components/NewsfeedCollectionPage";

export default function NewsfeedSavedPage() {
	return <NewsfeedCollectionPage mode="saved" />;
}