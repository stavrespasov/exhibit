import { AnalyzeInputSchema, parseRepository } from "@/lib/security/validation";
import { AppError } from "@/lib/errors";
import { analyze } from "@/lib/evidence/analyze";
import { evidenceModel } from "@/lib/ai/client";
import { database } from "@/lib/storage/exhibits";
import { reserveAnalysis } from "@/lib/security/rate-limit";
export const runtime = "nodejs";
export const maxDuration = 60;
async function boundedJson(request: Request) {
  if (!request.body) throw new AppError("EMPTY_INPUT", "Enter a repository and job description.");
  const reader = request.body.getReader();
  let size = 0;
  const parts: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 65536) { await reader.cancel(); throw new AppError("INPUT_TOO_LARGE", "The input is too large. Use a job description under 8,000 characters.", 413); }
    parts.push(value);
  }
  try { return JSON.parse(Buffer.concat(parts).toString("utf8")); }
  catch { throw new AppError("INVALID_INPUT", "The input could not be read. Please try again."); }
}
function publicError(error: unknown, aborted = false) {
  if (aborted) return new AppError("TIMEOUT", "This inspection exceeded its time limit. Try a smaller repository.", 504);
  if (error instanceof AppError) return error;
  return new AppError("ANALYSIS_FAILED", "This inspection couldn't be completed. Your inputs are preserved.", 503);
}
export async function POST(request: Request) {
  const cancel = new AbortController();
  const signal = AbortSignal.any([request.signal, cancel.signal, AbortSignal.timeout(45000)]);
  try {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) throw new AppError("ORIGIN", "This request could not be accepted.", 403);
    const parsed = AnalyzeInputSchema.safeParse(await boundedJson(request));
    if (!parsed.success) throw new AppError("INVALID_INPUT", parsed.error.issues[0]?.message ?? "Check the repository and job description.", 422);
    parseRepository(parsed.data.repoUrl);
    evidenceModel(); database();
    await reserveAnalysis(request, signal);
    const encoder = new TextEncoder();
    let cancelled = false;
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: unknown) => { if (!cancelled) controller.enqueue(encoder.encode(JSON.stringify(event) + "\n")); };
        try {
          const result = await analyze(parsed.data.repoUrl, parsed.data.jobDescription, signal, progress => send({ type: "progress", ...progress }));
          send({ type: "complete", id: result.id });
        } catch (error) {
          const failure = publicError(error, signal.aborted);
          send({ type: "error", code: failure.code, message: failure.message, retryAfter: failure.retryAfter });
        } finally { if (!cancelled) controller.close(); }
      },
      cancel() { cancelled = true; cancel.abort(); },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    const failure = publicError(error, signal.aborted);
    return Response.json({ code: failure.code, message: failure.message }, { status: failure.status, headers: { "Cache-Control": "no-store", ...(failure.retryAfter ? { "Retry-After": String(failure.retryAfter) } : {}) } });
  }
}
