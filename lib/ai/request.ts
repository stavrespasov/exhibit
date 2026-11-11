import { setTimeout as delay } from "node:timers/promises";

export async function withTemporaryRetry<T>(operation: () => Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  try { return await operation(); }
  catch (error) {
    if (signal.aborted) signal.throwIfAborted();
    if (!error || typeof error !== "object" || !("statusCode" in error) || error.statusCode !== 503) throw error;
    const headers = "responseHeaders" in error ? error.responseHeaders as Record<string, string> | undefined : undefined;
    const retryAfter = Number(headers?.["retry-after"] ?? 0);
    if (!Number.isFinite(retryAfter) || retryAfter > 2) throw error;
    await delay(Math.max(600, retryAfter * 1000), undefined, { signal });
    signal.throwIfAborted();
    return operation();
  }
}
