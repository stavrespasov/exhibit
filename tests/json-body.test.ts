import { expect, it } from "vitest";
import { boundedJson } from "../lib/security/json-body";

it("reads valid bounded JSON and rejects invalid JSON", async () => {
  await expect(boundedJson(new Request("http://localhost", { method: "POST", body: '{"value":1}' }), new AbortController().signal)).resolves.toEqual({ value: 1 });
  await expect(boundedJson(new Request("http://localhost", { method: "POST", body: "{" }), new AbortController().signal)).rejects.toMatchObject({ code: "INVALID_INPUT" });
});

it("rejects oversized streamed input", async () => {
  const request = new Request("http://localhost", { method: "POST", body: "x".repeat(65537) });
  await expect(boundedJson(request, new AbortController().signal)).rejects.toMatchObject({ code: "INPUT_TOO_LARGE", status: 413 });
});

it("cancels a stalled body when the analysis is aborted", async () => {
  let cancelled = false;
  const body = new ReadableStream<Uint8Array>({ cancel() { cancelled = true; } });
  const request = new Request("http://localhost", { method: "POST", body, duplex: "half" } as RequestInit);
  const controller = new AbortController();
  const reading = boundedJson(request, controller.signal);
  controller.abort(new Error("Analysis deadline"));
  await expect(reading).rejects.toThrow("Analysis deadline");
  expect(cancelled).toBe(true);
});
