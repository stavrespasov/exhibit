import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { randomBytes, createHash } from "node:crypto";
import type { Exhibit } from "../lib/evidence/result";
export default async function setup() {
  const values: Record<string,string> = { ...process.env } as Record<string,string>;
  try {
    for (const line of (await readFile(".env.local", "utf8")).split("\n")) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match && !values[match[1]]) values[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
  const origin = values.SUPABASE_URL, secret = values.SUPABASE_SECRET_KEY;
  if (!origin || !secret) throw new Error("Browser tests require a configured test store.");
  const headers = { apikey: secret, "Content-Type": "application/json" };
  const active = randomBytes(20).toString("base64url"), expired = randomBytes(20).toString("base64url");
  const createdAt = new Date().toISOString();
  const commitSha = "a".repeat(40);
  const excerpt = 'if (!excerpt.includes(quote)) return { valid: false };';
  const result: Exhibit = {
    schemaVersion: 1, id: active, title: "QA fixture — not a generated result",
    repository: { owner: "exhibit-tests", name: "synthetic-fixture", description: "Temporary browser-test fixture", commitSha, url: "https://github.com/exhibit-tests/synthetic-fixture" },
    requirements: [
      { id: "REQ-01", name: "Citation validation", sourceQuote: "Validate every source citation", keywords: ["validation"], category: "backend" },
      { id: "REQ-02", name: "Browser automation", sourceQuote: "Automate the browser flow", keywords: ["testing"], category: "testing" },
    ],
    cards: [
      { id: "EV-01", requirementId: "REQ-01", status: "supported", title: "QA: source inspection interaction", explanation: "Synthetic code used only to exercise the source inspector in browser tests.", limitations: ["This is a test fixture, not an analysis of a real applicant."], citations: [{ fileId: "FILE-01", filePath: "tests/fixture.ts", blobSha: "b".repeat(40), commitSha, startLine: 1, endLine: 1, exactQuote: excerpt, excerpt, excerptSha256: createHash("sha256").update(excerpt).digest("hex"), githubUrl: "https://github.com/exhibit-tests/synthetic-fixture/blob/" + commitSha + "/tests/fixture.ts#L1-L1" }] },
      { id: "EV-02", requirementId: "REQ-02", status: "not_observed", title: "QA: unsupported evidence state", explanation: "No corresponding implementation was found in this synthetic fixture.", citations: [], limitations: ["Fixture only."] },
    ],
    inspection: { filesDiscovered: 8, filesInspected: 1, treeTruncated: false, budgetReached: true, excludedFiles: 2, sourceCharacters: excerpt.length, failedFiles: 0, files: [{ path: "tests/fixture.ts", blobSha: "b".repeat(40), lineCount: 1 }] },
    createdAt, expiresAt: new Date(Date.now() + 3600000).toISOString(),
    metrics: { durationMs: 1000, modelId: "synthetic-test-fixture", inputTokens: 0, outputTokens: 0, estimatedModelUsd: 0, rejectedCitations: 0 },
  };
  const rows = [
    { id: active, repo_owner: result.repository.owner, repo_name: result.repository.name, commit_sha: commitSha, result, created_at: createdAt, expires_at: result.expiresAt },
    { id: expired, repo_owner: "exhibit-tests", repo_name: "expired-fixture", commit_sha: commitSha, result: { ...result, id: expired }, created_at: new Date(Date.now() - 172800000).toISOString(), expires_at: new Date(Date.now() - 86400000).toISOString() },
  ];
  const response = await fetch(origin + "/rest/v1/exhibits", { method: "POST", headers, body: JSON.stringify(rows), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Test fixture setup failed with HTTP " + response.status);
  await mkdir("work", { recursive: true });
  await writeFile("work/qa-fixture.json", JSON.stringify({ active, expired }));
  return async () => {
    const cleanup = await fetch(origin + "/rest/v1/exhibits?id=in.(" + active + "," + expired + ")", { method: "DELETE", headers, signal: AbortSignal.timeout(15000) });
    if (!cleanup.ok) throw new Error("Fixture cleanup failed with HTTP " + cleanup.status);
    await unlink("work/qa-fixture.json").catch(() => {});
  };
}
