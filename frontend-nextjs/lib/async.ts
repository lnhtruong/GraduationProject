/**
 * Async utilities for generic workflows.
 */

export interface PollingOptions<TData> {
  fetchFn: () => Promise<TData>;
  shouldStop: (data: TData) => boolean;
  interval?: number;
  maxPolls?: number;
  onProgress?: (data: TData, pollCount: number) => void;
  timeout?: number;
}

export async function poll<TData>(
  options: PollingOptions<TData>,
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
    if (timeout && Date.now() - startTime > timeout) {
      throw new Error(`Polling timeout after ${timeout}ms`);
    }

    const data = await fetchFn();
    pollCount++;

    onProgress?.(data, pollCount);

    if (shouldStop(data)) {
      return data;
    }

    await sleep(interval);
  }

  throw new Error(`Max polls reached (${maxPolls})`);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
