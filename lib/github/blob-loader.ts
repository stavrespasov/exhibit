import "server-only";
import { github } from "./client";
import { eligibleFile, rankFiles, containsLikelyCredential } from "./file-selection";
import type { Snapshot } from "./repository";
import type { Requirement, SourceManifest } from "../evidence/schema";
import { AppError } from "../errors";
export async function loadSources(repo: Snapshot, requirements: Requirement[], signal: AbortSignal, progress: (count: number, total: number) => void) {
  const eligible = repo.tree.filter(eligibleFile);
  if (!eligible.length) throw new AppError("NO_SOURCE", "No supported JavaScript or TypeScript source was found within this version's limits.", 422);
  const chosen = rankFiles(eligible, requirements);
  const manifest: SourceManifest = {
    owner: repo.owner, repo: repo.name, commitSha: repo.commitSha, inspectedAt: new Date().toISOString(),
    filesDiscovered: eligible.length, filesInspected: 0, treeTruncated: repo.treeTruncated,
    budgetReached: eligible.length > chosen.length, excludedFiles: repo.tree.length - eligible.length,
    totalSourceCharacters: 0, files: {},
  };
  const outputs: { fileId: string; path: string; numberedSource: string }[] = [];
  let failedFiles = 0, fetched = 0, forwarded = 0;
  for (let offset = 0; offset < chosen.length; offset += 4) {
    const batch = chosen.slice(offset, offset + 4);
    const results = await Promise.allSettled(batch.map(file => github<{ sha: string; encoding: string; content: string; size: number }>(
      "/repos/" + encodeURIComponent(repo.owner) + "/" + encodeURIComponent(repo.name) + "/git/blobs/" + file.sha, signal, 48 * 1024)));
    for (let i = 0; i < results.length; i++) {
      fetched++; progress(fetched, chosen.length);
      const result = results[i];
      if (result.status !== "fulfilled") { failedFiles++; continue; }
      const blob = result.value, entry = batch[i];
      if (blob.sha !== entry.sha || blob.encoding !== "base64" || blob.size > 24 * 1024) { failedFiles++; continue; }
      const bytes = Buffer.from(blob.content.replace(/\s/g, ""), "base64");
      const content = bytes.toString("utf8").replace(/\r\n?/g, "\n");
      if (bytes.length > 24 * 1024 || content.includes("\0") || containsLikelyCredential(content)) { manifest.excludedFiles++; continue; }
      const numberedSource = content.split("\n").map((line, j) => String(j + 1) + ": " + line).join("\n");
      if (forwarded + numberedSource.length > 80000) { manifest.budgetReached = true; continue; }
      const fileId = "FILE-" + String(outputs.length + 1).padStart(2, "0");
      manifest.files[fileId] = { path: entry.path, blobSha: blob.sha, content, lineCount: content.split("\n").length };
      outputs.push({ fileId, path: entry.path, numberedSource });
      forwarded += numberedSource.length; manifest.totalSourceCharacters += content.length;
    }
    if (signal.aborted) throw new AppError("TIMEOUT", "Inspection took too long. Try a smaller repository.", 504);
  }
  manifest.filesInspected = outputs.length;
  if (!outputs.length) throw new AppError("NO_READABLE_SOURCE", "No source files could be inspected within the current limits. Try another project.", 422);
  return { manifest, files: outputs, failedFiles };
}
