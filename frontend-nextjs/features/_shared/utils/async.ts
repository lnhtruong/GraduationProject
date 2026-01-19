/**
 * Async Workflow Utilities
 * Reusable patterns for async operations like polling, retries, backoff
 */

export interface PollingOptions<TData> {
  /**
   * Function to fetch data
   */
  fetchFn: () => Promise<TData>;

  /**
   * Condition to stop polling
   */
  shouldStop: (data: TData) => boolean;

  /**
   * Polling interval in milliseconds
   * @default 2000
   */
  interval?: number;

  /**
   * Maximum number of polls before giving up
   * @default Infinity
   */
  maxPolls?: number;

  /**
   * Progress callback
   */
  onProgress?: (data: TData, pollCount: number) => void;

  /**
   * Timeout in milliseconds (total max time)
   * @default undefined (no timeout)
   */
  timeout?: number;
}

/**
 * Generic polling utility
 * @example
 * const result = await poll({
 *   fetchFn: () => api.getStatus(jobId),
 *   shouldStop: (data) => data.status === 'completed',
 *   onProgress: (data) => console.log(data.progress)
 * });
 */
export async function poll<TData>(
  options: PollingOptions<TData>
): Promise<TData> {
  const {
    fetchFn,
    shouldStop,
    interval = 2000,
    maxPolls = Infinity,
    onProgress,
    timeout,
  } = options;

  const startTime = Date.now();
  let pollCount = 0;

  while (pollCount < maxPolls) {
    // Check timeout
    if (timeout && Date.now() - startTime > timeout) {
      throw new Error(`Polling timeout after ${timeout}ms`);
    }

    // Fetch data
    const data = await fetchFn();
    pollCount++;

    // Progress callback
    if (onProgress) {
      onProgress(data, pollCount);
    }

    // Check stop condition
    if (shouldStop(data)) {
      return data;
    }

    // Wait before next poll
    await sleep(interval);
  }

  throw new Error(`Max polls reached (${maxPolls})`);
}

export interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds
   * @default 1000
   */
  baseDelay?: number;

  /**
   * Use exponential backoff
   * @default true
   */
  exponentialBackoff?: boolean;

  /**
   * Maximum delay cap in milliseconds
   * @default 30000
   */
  maxDelay?: number;

  /**
   * Custom retry condition
   * @default (error) => true
   */
  shouldRetry?: (error: unknown, attemptNumber: number) => boolean;

  /**
   * Callback before each retry
   */
  onRetry?: (error: unknown, attemptNumber: number, delay: number) => void;
}

/**
 * Generic retry utility with exponential backoff
 * @example
 * const data = await retry(
 *   () => api.fetchData(),
 *   { maxRetries: 3, exponentialBackoff: true }
 * );
 */
export async function retry<TData>(
  fn: () => Promise<TData>,
  options: RetryOptions = {}
): Promise<TData> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    exponentialBackoff = true,
    maxDelay = 30000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt === maxRetries || !shouldRetry(error, attempt + 1)) {
        throw error;
      }

      // Calculate delay
      const delay = exponentialBackoff
        ? Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
        : baseDelay;

      // Callback
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }

      // Wait before retry
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a timeout promise
 */
export function timeout<TData>(
  promise: Promise<TData>,
  ms: number,
  timeoutError?: Error
): Promise<TData> {
  return Promise.race([
    promise,
    sleep(ms).then(() => {
      throw timeoutError || new Error(`Operation timed out after ${ms}ms`);
    }),
  ]);
}

/**
 * Batch multiple async operations with concurrency limit
 */
export async function batch<TInput, TOutput>(
  items: TInput[],
  fn: (item: TInput) => Promise<TOutput>,
  concurrency: number = 5
): Promise<TOutput[]> {
  const results: TOutput[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = fn(item).then((result) => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((p) => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}
