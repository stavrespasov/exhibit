export const FREE_MODELS = ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"] as const;
export type FreeModelId = typeof FREE_MODELS[number];
export type QuotaInfo = { kind: "daily" | "temporary" | "unknown"; modelSpecific: boolean; retryAfter?: number };

function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : undefined;
}
export function providerStatus(error: unknown): number {
  let value = object(error);
  for (let depth = 0; value && depth < 5; depth++, value = object(value.cause)) {
    if (typeof value.statusCode === "number") return value.statusCode;
  }
  return 0;
}

// Gemini's daily allowance resets at midnight in America/Los_Angeles,
// including its daylight-saving transitions. Never promise a one-minute reset.
export function secondsUntilDailyReset(now = new Date()): number {
  const format = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23" });
  const parts = Object.fromEntries(format.formatToParts(now).map(part => [part.type, part.value]));
  const next = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) + 1));
  for (const hour of [7, 8]) {
    const candidate = new Date(next.getTime() + hour * 3600000);
    const candidateParts = Object.fromEntries(format.formatToParts(candidate).map(part => [part.type, part.value]));
    if (candidateParts.hour === "00" && candidateParts.day === String(next.getUTCDate()).padStart(2, "0")) {
      return Math.max(1, Math.ceil((candidate.getTime() - now.getTime()) / 1000));
    }
  }
  return 86400;
}

export class FreeModelQuotaError extends Error {
  readonly statusCode = 429;
  constructor(readonly quota: QuotaInfo) { super("Available free models are rate-limited."); }
}

export function providerQuota(error: unknown, now = new Date()): QuotaInfo {
  if (error instanceof FreeModelQuotaError) return error.quota;
  let value = object(error);
  for (let depth = 0; value && depth < 5 && value.statusCode !== 429; depth++) value = object(value.cause);
  if (!value) return { kind: "unknown", modelSpecific: false };
  let body: Record<string, unknown> | undefined;
  if (typeof value.responseBody === "string" && value.responseBody.length <= 64000) {
    try { body = object(JSON.parse(value.responseBody)); } catch {}
  }
  const details = object(body?.error)?.details;
  const entries = Array.isArray(details) ? details.slice(0, 16).map(object).filter(Boolean) : [];
  let daily = false, modelSpecific = false, shared = false, temporary = false;
  const delays: number[] = [];
  const headers = object(value.responseHeaders);
  if (typeof headers?.["retry-after"] === "string" && /^\d+(?:\.\d+)?$/.test(headers["retry-after"])) delays.push(Number(headers["retry-after"]));
  for (const entry of entries) {
    if (String(entry?.["@type"]).endsWith("QuotaFailure") && Array.isArray(entry?.violations)) {
      for (const violation of entry.violations.slice(0, 16).map(object)) {
        const identity = String(violation?.quotaId ?? "") + " " + String(violation?.quotaMetric ?? "");
        daily ||= /PerDay|per_day|daily/i.test(identity);
        temporary ||= /PerMinute|per_minute/i.test(identity);
        const specific = /PerModel|per_model/i.test(identity) || typeof object(violation?.quotaDimensions)?.model === "string";
        modelSpecific ||= specific;
        shared ||= !specific;
      }
    }
    if (String(entry?.["@type"]).endsWith("RetryInfo") && typeof entry?.retryDelay === "string") {
      const duration = entry.retryDelay.match(/^(\d+(?:\.\d+)?)s$/);
      if (duration) delays.push(Number(duration[1]));
    }
  }
  const delay = Math.max(0, ...delays.filter(Number.isFinite));
  return { kind: daily ? "daily" : temporary || delay > 0 ? "temporary" : "unknown", modelSpecific: modelSpecific && !shared,
    retryAfter: daily ? secondsUntilDailyReset(now) : delay > 0 ? Math.min(90000, Math.ceil(delay)) : undefined };
}

export async function withFreeModel<T>(primary: FreeModelId, operation: (modelId: FreeModelId) => Promise<T>, signal: AbortSignal,
  onFallback?: (modelId: FreeModelId) => void): Promise<T> {
  signal.throwIfAborted();
  if (!FREE_MODELS.includes(primary)) throw new Error("Unsupported model for free generation.");
  try { return await operation(primary); }
  catch (error) {
    signal.throwIfAborted();
    const first = providerQuota(error);
    // Shared/project limits and unknown 429s must not trigger model cycling.
    if (providerStatus(error) !== 429 || !first.modelSpecific) throw error;
    const alternate = primary === "gemini-3.5-flash-lite" ? "gemini-3.6-flash" : "gemini-3.5-flash-lite";
    onFallback?.(alternate);
    signal.throwIfAborted();
    try { return await operation(alternate); }
    catch (secondError) {
      signal.throwIfAborted();
      if (providerStatus(secondError) !== 429) throw secondError;
      const second = providerQuota(secondError);
      if (!second.modelSpecific) throw secondError;
      const retryAfter = Math.min(first.retryAfter ?? 60, second.retryAfter ?? 60);
      throw new FreeModelQuotaError({ kind: first.kind === "daily" && second.kind === "daily" ? "daily" : "temporary", modelSpecific: true, retryAfter });
    }
  }
}
