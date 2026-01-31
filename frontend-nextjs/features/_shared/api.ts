/**
 * Generic API Factory
 * Base factory for creating API objects
 */

// ============================================================================
// API FACTORY
// ============================================================================

export function createApi<
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
