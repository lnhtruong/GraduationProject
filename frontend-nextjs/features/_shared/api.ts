/**
 * Generic API Factory
 * Base factory for creating API objects
 */

// ============================================================================
// SIMPLE API FACTORY (for instant mutations like auth)
// ============================================================================

export function createSimpleApi<
  TApi extends Record<string, (...args: never[]) => Promise<unknown>>,
>(api: TApi): TApi {
  return api;
}

// ============================================================================
// JOB API FACTORY (for async job workflows like upload/video processing)
// ============================================================================

export function createJobApi<
  TParams = void,
  TStatus = unknown,
  TResult = unknown,
>(config: {
  startJob: (params: TParams) => Promise<string>;
  getStatus: (jobId: string) => Promise<TStatus>;
  processResult?: (status: TStatus) => TResult | Promise<TResult>;
}) {
  return {
    startJob: config.startJob,
    getStatus: config.getStatus,
    processResult: config.processResult,
  };
}

// Backward compatibility
export const createApi = createJobApi;
