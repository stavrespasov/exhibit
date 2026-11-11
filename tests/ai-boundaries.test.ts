import { expect, it, vi } from "vitest";
import { withTemporaryRetry } from "../lib/ai/request";
import { recoverCandidates } from "../lib/ai/recovery";
import { verifyCards } from "../lib/evidence/verifier";

it("retries a temporary provider failure once", async () => {
  const operation = vi.fn().mockRejectedValueOnce({ statusCode: 503 }).mockResolvedValueOnce("ready");
  await expect(withTemporaryRetry(operation, new AbortController().signal)).resolves.toBe("ready");
  expect(operation).toHaveBeenCalledTimes(2);
});

it("does not retry quota, permission, or long Retry-After errors", async () => {
  for (const failure of [{ statusCode: 429 }, { statusCode: 403 }, { statusCode: 503, responseHeaders: { "retry-after": "30" } }]) {
    const operation = vi.fn().mockRejectedValue(failure);
    await expect(withTemporaryRetry(operation, new AbortController().signal)).rejects.toBe(failure);
    expect(operation).toHaveBeenCalledTimes(1);
  }
});

it("does not start model work after cancellation", async () => {
  const controller = new AbortController();
  controller.abort(new Error("Cancelled"));
  const operation = vi.fn();
  await expect(withTemporaryRetry(operation, controller.signal)).rejects.toThrow("Cancelled");
  expect(operation).not.toHaveBeenCalled();
});

it("rejects incomplete, malformed, and excessive proposal envelopes", () => {
  for (const text of ['{"cards":[', '{"result":[]}', JSON.stringify({ cards: Array(9).fill({}) })]) expect(recoverCandidates(text)).toBeNull();
});

it("preserves a valid card while withholding another malformed proposal", () => {
  const code = "export const read = () => db.user.findMany();";
  const citation = { fileId: "FILE-01", startLine: 1, endLine: 1, exactQuote: code };
  const proposals = recoverCandidates(JSON.stringify({ cards: [
    { requirementId: "REQ-01", status: "supported", title: "Database query", explanation: "A database read is present.", citations: [citation], limitations: [] },
    { requirementId: "REQ-02", status: "supported", title: "Unvalidated experience", explanation: "Unvalidated claim", citations: [{ ...citation, exactQuote: "x".repeat(2001) }], limitations: [] },
  ] }));
  expect(proposals).not.toBeNull();
  const result = verifyCards(proposals!, [
    { id: "REQ-01", name: "Database persistence", sourceQuote: "Use a database", keywords: ["database"], category: "data" },
    { id: "REQ-02", name: "API validation", sourceQuote: "Validate input", keywords: ["validation"], category: "backend" },
  ], { owner: "owner", repo: "repo", commitSha: "a".repeat(40), inspectedAt: new Date().toISOString(), filesDiscovered: 1, filesInspected: 1, treeTruncated: false, budgetReached: false, excludedFiles: 0, totalSourceCharacters: code.length, files: { "FILE-01": { path: "lib/db.ts", blobSha: "b".repeat(40), content: code, lineCount: 1 } } });
  expect(result.cards[0].status).toBe("supported");
  expect(result.cards[0].citations).toHaveLength(1);
  expect(result.cards[1].status).toBe("not_observed");
  expect(result.cards[1].explanation).not.toContain("Unvalidated claim");
  expect(result.cards[1].validationNote).toContain("withheld");
});
