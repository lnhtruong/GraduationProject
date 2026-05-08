import NewsfeedPage from "@/features/newsfeed";

export default async function NewsfeedRoutePage({
	searchParams,
}: {
	searchParams?: Promise<{ videoId?: string | string[] }>;
}) {
	const resolvedSearchParams = await searchParams;
	const rawVideoId = Array.isArray(resolvedSearchParams?.videoId)
		? resolvedSearchParams.videoId[0]
		: resolvedSearchParams?.videoId;
	const initialVideoId = rawVideoId ? Number(rawVideoId) : null;

	return <NewsfeedPage initialVideoId={Number.isFinite(initialVideoId ?? NaN) ? initialVideoId : null} />;
}
