import { useQuery } from "@tanstack/react-query";
import { cartSuggestionApi } from "./cart-suggestion.api";

const SUGGESTION_QUERY_KEY = ["cart", "suggestions"] as const;

export function useCartSuggestions(limit = 6) {
  return useQuery({
    queryKey: [...SUGGESTION_QUERY_KEY, limit],
    queryFn: () => cartSuggestionApi.getSuggestedCourses(limit),
    staleTime: 5 * 60 * 1000,
  });
}
