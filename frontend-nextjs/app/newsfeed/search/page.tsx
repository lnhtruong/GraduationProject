import { buildPageMetadata } from "@/lib/metadata";

export const metadata = buildPageMetadata({
  title: "Tìm kiếm bảng tin",
  description: "Tìm các video bài học ngắn, chủ đề và nội dung học tập trên bảng tin LearnHub.",
  path: "/newsfeed/search",
});

import { NewsfeedCollectionPage } from "@/features/newsfeed/components/NewsfeedCollectionPage";

export default async function NewsfeedSearchPage({
	searchParams,
}: {
	searchParams?: Promise<{ q?: string | string[] }>;
}) {
	const resolvedSearchParams = await searchParams;
	const query = Array.isArray(resolvedSearchParams?.q)
		? resolvedSearchParams.q[0]
		: resolvedSearchParams?.q;

	return <NewsfeedCollectionPage mode="search" searchTerm={query ?? ""} />;
}