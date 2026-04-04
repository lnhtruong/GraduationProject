import { useQuery } from "@tanstack/react-query";
import { createKeyFactory } from "@/lib/queryKeys";
import { newsfeedApi } from "./newsfeed.api";

const keys = createKeyFactory("newsfeed");

export const newsfeedKeys = keys;

export function useNewsfeedFeed(enabled = true) {
	return useQuery({
		queryKey: keys.custom("demo", "feed"),
		queryFn: newsfeedApi.getFeed,
		enabled,
		staleTime: 45 * 1000,
	});
}
