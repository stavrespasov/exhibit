import { AppError } from "../errors";

export async function boundedJson(request: Request, signal: AbortSignal): Promise<unknown> {
  signal.throwIfAborted();
  if (!request.body) throw new AppError("EMPTY_INPUT", "Enter a repository and job description.");
  const reader = request.body.getReader();
  const cancel = () => { void reader.cancel(signal.reason).catch(() => {}); };
  signal.addEventListener("abort", cancel, { once: true });
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      size += value.byteLength;
      if (size > 65536) {
        await reader.cancel();
        throw new AppError("INPUT_TOO_LARGE", "The input is too large. Use a job description under 8,000 characters.", 413);
      }
      parts.push(value);
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
  try { return JSON.parse(Buffer.concat(parts).toString("utf8")); }
  catch { throw new AppError("INVALID_INPUT", "The input could not be read. Please try again."); }
}
