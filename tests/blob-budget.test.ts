import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("../lib/github/client", () => ({ github: vi.fn() }));
import { github } from "../lib/github/client";
import { loadSources } from "../lib/github/blob-loader";

it("keeps the model source context bounded and discloses omitted files", async () => {
  const content = "x".repeat(18000);
  vi.mocked(github).mockImplementation(async path => ({ sha: path.split("/").at(-1), encoding: "base64", size: content.length, content: Buffer.from(content).toString("base64") }));
  const tree = ["a", "b", "c", "d", "e"].map(letter => ({ path: "lib/" + letter + ".ts", mode: "100644", type: "blob", sha: letter.repeat(40), size: content.length }));
  const result = await loadSources({ owner: "owner", name: "repo", description: "", commitSha: "f".repeat(40), treeSha: "0".repeat(40), tree, treeTruncated: false, filesDiscovered: 5 }, [], new AbortController().signal, vi.fn());
  expect(result.files).toHaveLength(4);
  expect(result.files.reduce((sum, file) => sum + file.numberedSource.length, 0)).toBeLessThanOrEqual(80000);
  expect(result.manifest.budgetReached).toBe(true);
  expect(result.manifest.filesDiscovered).toBe(5);
  expect(result.failedFiles).toBe(0);
});
