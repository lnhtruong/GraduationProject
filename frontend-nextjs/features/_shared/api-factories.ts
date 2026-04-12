/**
 * Generic API Factory
 * Base factory for creating API objects
 */

import { apiClient, inferenceClient } from "@/lib/http";

// Single entry point for feature-layer HTTP clients.
export const apiHttpClient = apiClient;
export const inferenceHttpClient = inferenceClient;

type AsyncApiRecord = Record<string, (...args: never[]) => Promise<unknown>>;

// ============================================================================
// SIMPLE API FACTORY (for instant mutations like auth)
// ============================================================================

export function createApi<TApi extends AsyncApiRecord>(api: TApi): TApi {
  return api;
}
