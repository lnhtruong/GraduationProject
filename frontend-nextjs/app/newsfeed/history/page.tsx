import { buildPrivatePageMetadata } from "@/lib/metadata";

export const metadata = buildPrivatePageMetadata(
  "Lịch sử xem",
  "Theo dõi lịch sử xem video bài học ngắn của bạn trên LearnHub.",
);

import { NewsfeedCollectionPage } from "@/features/newsfeed/components/NewsfeedCollectionPage";

export default function NewsfeedHistoryPage() {
	return <NewsfeedCollectionPage mode="history" />;
}