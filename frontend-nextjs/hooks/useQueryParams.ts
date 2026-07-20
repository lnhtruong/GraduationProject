"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface ParsedQueryParams {
  q: string;
  categoryIds: number[];
  level: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  sort: string;
  page: number;
}

type QueryParamValue = string | number | number[] | null | undefined;

export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse current URL params
  const params = useMemo((): ParsedQueryParams => {
    const q = searchParams.get("q") || "";
    
    // Support categoryId=1&categoryId=2
    const categoryIds = searchParams
      .getAll("categoryId")
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id) && id > 0);

    const level = searchParams.get("level") || "all";
    
    const minPriceRaw = searchParams.get("minPrice");
    const minPrice = minPriceRaw ? Math.max(0, Number(minPriceRaw)) : 0;

    const maxPriceRaw = searchParams.get("maxPrice");
    const maxPrice = maxPriceRaw ? Math.max(0, Number(maxPriceRaw)) : 5000000;

    const minRatingRaw = searchParams.get("minRating");
    const minRating = minRatingRaw ? Math.max(0, Math.min(5, Number(minRatingRaw))) : 0;

    const sort = searchParams.get("sort") || "newest";
    
    const pageRaw = searchParams.get("page");
    const page = pageRaw ? Math.max(1, Number(pageRaw)) : 1;

    return {
      q,
      categoryIds,
      level,
      minPrice,
      maxPrice,
      minRating,
      sort,
      page,
    };
  }, [searchParams]);

  const setQueryParams = useCallback(
    (newParams: Partial<Record<keyof ParsedQueryParams | "categoryId", QueryParamValue>>) => {
      const nextParams = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, value]) => {
        // Map categoryIds internally to categoryId in the URL if it comes in that way
        const urlKey = key === "categoryIds" ? "categoryId" : key;

        if (value === null || value === undefined || value === "" || value === "all" || value === 0) {
          nextParams.delete(urlKey);
        } else if (Array.isArray(value)) {
          nextParams.delete(urlKey);
          value.forEach((val) => {
            if (val !== null && val !== undefined) {
              nextParams.append(urlKey, String(val));
            }
          });
        } else {
          nextParams.set(urlKey, String(value));
        }
      });

      // Always reset page to 1 when filters or query change, unless page is explicitly being set
      if (!("page" in newParams)) {
        nextParams.delete("page");
      }

      router.push(`${pathname}?${nextParams.toString()}`);
    },
    [searchParams, pathname, router]
  );

  const clearFilters = useCallback(() => {
    const nextParams = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) {
      nextParams.set("q", q);
    }
    router.push(`${pathname}?${nextParams.toString()}`);
  }, [searchParams, pathname, router]);

  return {
    params,
    setQueryParams,
    clearFilters,
  };
}
