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