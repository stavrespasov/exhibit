import { describe, expect, it } from "vitest";
import { verifyCitation, verifyCards } from "../lib/evidence/verifier";
import type { SourceManifest, Requirement } from "../lib/evidence/schema";
const commit = "a".repeat(40);
const content = "import Stripe from 'stripe';\r\nexport function verifyEvent(body: string) {\r\n  return stripe.webhooks.constructEvent(body, signature, secret);\r\n}\r\n";
const manifest: SourceManifest = {
  owner: "example", repo: "demo", commitSha: commit, inspectedAt: "2026-11-10T00:00:00Z",
  filesDiscovered: 8, filesInspected: 1, treeTruncated: false, budgetReached: false, excludedFiles: 2,
  totalSourceCharacters: content.length,
  files: { "FILE-01": { path: "src/api/web hook.ts", blobSha: "b".repeat(40), lineCount: 5, content } },
};
const citation = { fileId: "FILE-01", startLine: 2, endLine: 4, exactQuote: "stripe.webhooks.constructEvent(body, signature, secret)" };
const requirement: Requirement = { id: "REQ-01", name: "Stripe webhook handling", sourceQuote: "Implement Stripe webhooks", keywords: ["stripe", "webhook"], category: "backend" };
const proposed = { requirementId: "REQ-01", title: "Signature verification", status: "supported", explanation: "The inspected handler calls signature verification.", citations: [citation], limitations: ["Not executed."] };
describe("citation trust boundary", () => {
  it("reconstructs source, normalizes CRLF and pins encoded links", () => {
    const result = verifyCitation(citation, manifest);
    expect(result.valid).toBe(true);
    if (!result.valid) throw new Error("Expected citation");
    expect(result.citation.excerpt).not.toContain("\r");
    expect(result.citation.githubUrl).toBe("https://github.com/example/demo/blob/" + commit + "/src/api/web%20hook.ts#L2-L4");
    expect(result.citation.excerptSha256).toMatch(/^[0-9a-f]{64}$/);
  });
  it.each([
    [{ ...citation, fileId: "FILE-99" }, "UNKNOWN_FILE"],
    [{ ...citation, endLine: 999 }, "INVALID_RANGE"],
    [{ ...citation, startLine: 3, endLine: 2 }, "INVALID_RANGE"],
    [{ ...citation, startLine: 0 }, "INVALID_SCHEMA"],
    [{ ...citation, startLine: 2.5 }, "INVALID_SCHEMA"],
    [{ ...citation, exactQuote: "invented.verifySignature(request)" }, "QUOTE_MISMATCH"],
    [{ ...citation, exactQuote: "            " }, "TRIVIAL_QUOTE"],
  ])("rejects forged or unusable references", (value, reason) => expect(verifyCitation(value, manifest)).toEqual({ valid: false, reason }));
  it("removes unsupported explanations when all citations fail", () => {
    const result = verifyCards([{ ...proposed, citations: [{ ...citation, fileId: "FILE-99" }] }], [requirement], manifest);
    expect(result.cards[0].status).toBe("not_observed");
    expect(result.cards[0].explanation).not.toBe(proposed.explanation);
    expect(result.rejectedCitations).toBe(1);
  });
  it("retains partial evidence only with valid implementation references", () => {
    expect(verifyCards([{ ...proposed, status: "partial" }], [requirement], manifest).cards[0].status).toBe("partial");
  });
  it("withholds a multi-source claim when one citation is forged", () => {
    const mixed = { ...proposed, citations: [citation, { ...citation, fileId: "FILE-99" }] };
    const result = verifyCards([mixed], [requirement], manifest);
    expect(result.cards[0].status).toBe("not_observed");
    expect(result.cards[0].explanation).not.toBe(proposed.explanation);
    expect(result.rejectedCitations).toBe(1);
  });
  it("does not turn dependencies into implementation evidence", () => {
    const dependency = { ...manifest, files: { "FILE-01": { ...manifest.files["FILE-01"], path: "package.json" } } };
    expect(verifyCards([proposed], [requirement], dependency).cards[0].status).toBe("not_observed");
  });
  it("keeps missing requirements visible", () => {
    expect(verifyCards([], [requirement], manifest).cards[0].status).toBe("not_observed");
  });
});
