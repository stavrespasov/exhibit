import { expect, it, vi } from "vitest";
import { FREE_MODELS, FreeModelQuotaError, providerQuota, providerStatus, secondsUntilDailyReset, withFreeModel, type FreeModelId } from "../lib/ai/availability";

function quota(id = "GenerateRequestsPerMinutePerProjectPerModel-FreeTier", retry = "12.4s") {
  return { statusCode: 429, responseBody: JSON.stringify({ error: { details: [
    { "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [{ quotaId: id, quotaMetric: "generativelanguage.googleapis.com/generate_content_free_tier_requests" }] },
    { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: retry },
  ] } }) };
}

it("extracts the provider cooldown without treating it as a daily quota", () => {
  expect(providerQuota(quota())).toEqual({ kind: "temporary", modelSpecific: true, retryAfter: 13 });
});

it("does not mistake a daily quota's short RetryInfo for its reset time", () => {
  const now = new Date("2026-11-11T19:00:00Z");
  expect(providerQuota(quota("GenerateRequestsPerDayPerProjectPerModel-FreeTier", "10s"), now)).toEqual({ kind: "daily", modelSpecific: true, retryAfter: 13 * 3600 });
});

it("calculates Pacific midnight across daylight-saving boundaries", () => {
  expect(secondsUntilDailyReset(new Date("2026-03-08T07:00:00Z"))).toBe(3600);
  expect(secondsUntilDailyReset(new Date("2026-03-08T10:00:00Z"))).toBe(21 * 3600);
  expect(secondsUntilDailyReset(new Date("2026-11-01T07:00:00Z"))).toBe(25 * 3600);
});

it("handles malformed, oversized, and non-provider 429 bodies conservatively", () => {
  for (const responseBody of ["not JSON", "x".repeat(64001), JSON.stringify({ error: { details: "wrong" } })]) {
    expect(providerQuota({ statusCode: 429, responseBody })).toEqual({ kind: "unknown", modelSpecific: false, retryAfter: undefined });
  }
  expect(providerQuota({ statusCode: 429, responseHeaders: { "retry-after": "45" } }).retryAfter).toBe(45);
});

it("uses one other allowlisted free model after a model-specific 429", async () => {
  const operation = vi.fn().mockRejectedValueOnce(quota()).mockResolvedValueOnce("verified later");
  const switched = vi.fn();
  await expect(withFreeModel("gemini-3.6-flash", operation, new AbortController().signal, switched)).resolves.toBe("verified later");
  expect(operation.mock.calls.map(call => call[0])).toEqual(["gemini-3.6-flash", "gemini-3.5-flash-lite"]);
  expect(switched).toHaveBeenCalledWith("gemini-3.5-flash-lite");
  expect(operation.mock.calls.every(call => FREE_MODELS.includes(call[0]))).toBe(true);
});

it("does not switch on permission, shared-project, unknown quota, or format failures", async () => {
  for (const failure of [{ statusCode: 403 }, { statusCode: 429 }, { statusCode: 503 }, quota("RequestsPerMinutePerProject"), new Error("malformed candidates")]) {
    const operation = vi.fn().mockRejectedValue(failure);
    await expect(withFreeModel("gemini-3.6-flash", operation, new AbortController().signal)).rejects.toBe(failure);
    expect(operation).toHaveBeenCalledTimes(1);
  }
});

it("does not switch when a response includes both shared and model-specific quotas", async () => {
  const failure = quota();
  const body = JSON.parse(failure.responseBody);
  body.error.details[0].violations.push({ quotaId: "RequestsPerMinutePerProject" });
  failure.responseBody = JSON.stringify(body);
  const operation = vi.fn().mockRejectedValue(failure);
  await expect(withFreeModel("gemini-3.6-flash", operation, new AbortController().signal)).rejects.toBe(failure);
  expect(operation).toHaveBeenCalledTimes(1);
});

it("stops after two limited free models and uses the earliest valid retry", async () => {
  const operation = vi.fn().mockRejectedValueOnce(quota("GenerateRequestsPerDayPerProjectPerModel-FreeTier"))
    .mockRejectedValueOnce(quota(undefined, "30s"));
  let failure: unknown;
  try { await withFreeModel("gemini-3.6-flash", operation, new AbortController().signal); } catch (error) { failure = error; }
  expect(failure).toBeInstanceOf(FreeModelQuotaError);
  expect(providerStatus(failure)).toBe(429);
  expect(providerQuota(failure)).toEqual({ kind: "temporary", modelSpecific: true, retryAfter: 30 });
  expect(operation).toHaveBeenCalledTimes(2);
});

it("honors a shared-project cooldown encountered on the alternate", async () => {
  const shared = quota("RequestsPerMinutePerProject", "90s");
  const operation = vi.fn().mockRejectedValueOnce(quota()).mockRejectedValueOnce(shared);
  await expect(withFreeModel("gemini-3.6-flash", operation, new AbortController().signal)).rejects.toBe(shared);
  expect(providerQuota(shared).retryAfter).toBe(90);
});

it("does not start an alternate after cancellation", async () => {
  const controller = new AbortController();
  const operation = vi.fn().mockImplementation(() => { controller.abort(new Error("Cancelled")); throw quota(); });
  await expect(withFreeModel("gemini-3.6-flash", operation, controller.signal)).rejects.toThrow("Cancelled");
  expect(operation).toHaveBeenCalledTimes(1);
});

it("rejects a model outside the free allowlist before starting a request", async () => {
  const operation = vi.fn();
  await expect(withFreeModel("unapproved-model" as FreeModelId, operation, new AbortController().signal)).rejects.toThrow("Unsupported model");
  expect(operation).not.toHaveBeenCalled();
});
