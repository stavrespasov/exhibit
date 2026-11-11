import { AnalyzeInputSchema, parseRepository } from "@/lib/security/validation";
import { AppError } from "@/lib/errors";
import { analyze } from "@/lib/evidence/analyze";
import { evidenceModel } from "@/lib/ai/client";
import { database } from "@/lib/storage/exhibits";
import { reserveAnalysis } from "@/lib/security/rate-limit";
import { assertSameOrigin } from "@/lib/security/origin";
import { boundedJson } from "@/lib/security/json-body";
export const runtime = "nodejs";
export const maxDuration = 60;
function publicError(error: unknown, aborted = false) {
  if (aborted) return new AppError("TIMEOUT", "This inspection exceeded its time limit. Try a smaller repository.", 504);
  if (error instanceof AppError) return error;
  return new AppError("ANALYSIS_FAILED", "This inspection couldn't be completed. Your inputs are preserved.", 503);
}
export async function POST(request: Request) {
  const cancel = new AbortController();
  const signal = AbortSignal.any([request.signal, cancel.signal, AbortSignal.timeout(45000)]);
  try {
    assertSameOrigin(request);
    const parsed = AnalyzeInputSchema.safeParse(await boundedJson(request, signal));
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
