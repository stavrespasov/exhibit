import "server-only";
import { randomBytes } from "node:crypto";
import { parseRepository } from "../security/validation";
import { snapshot } from "../github/repository";
import { loadSources } from "../github/blob-loader";
import { extractRequirements } from "../ai/requirements";
import { proposeEvidence } from "../ai/evidence";
import { evidenceModel } from "../ai/client";
import { verifyCards } from "./verifier";
import { saveExhibit } from "../storage/exhibits";
import type { Exhibit } from "./result";
export type Progress = { phase: "repository" | "requirements" | "source" | "evidence" | "verification" | "saving"; current?: number; total?: number };
export async function analyze(repoUrl: string, job: string, signal: AbortSignal, onProgress: (progress: Progress) => void): Promise<Exhibit> {
  const start = performance.now();
  const target = parseRepository(repoUrl);
  onProgress({ phase: "repository" });
  const repository = await snapshot(target.owner, target.repo, signal);
  onProgress({ phase: "requirements" });
  const extracted = await extractRequirements(job, signal);
  onProgress({ phase: "source" });
  const source = await loadSources(repository, extracted.requirements, signal, (current, total) => onProgress({ phase: "source", current, total }));
  onProgress({ phase: "evidence" });
  const proposed = await proposeEvidence(extracted.requirements, source.files, signal);
  onProgress({ phase: "verification" });
  const verified = verifyCards(proposed.cards, extracted.requirements, source.manifest);
  const created = new Date();
  const inputTokens = (extracted.usage.inputTokens ?? 0) + (proposed.usage.inputTokens ?? 0);
  const outputTokens = (extracted.usage.outputTokens ?? 0) + (proposed.usage.outputTokens ?? 0);
  const result: Exhibit = {
    schemaVersion: 1, id: randomBytes(20).toString("base64url"), title: extracted.title,
    repository: { owner: repository.owner, name: repository.name, description: repository.description, commitSha: repository.commitSha, url: "https://github.com/" + repository.owner + "/" + repository.name },
    requirements: extracted.requirements, cards: verified.cards,
    inspection: {
      filesDiscovered: source.manifest.filesDiscovered, filesInspected: source.manifest.filesInspected,
      treeTruncated: source.manifest.treeTruncated, budgetReached: source.manifest.budgetReached,
      excludedFiles: source.manifest.excludedFiles, sourceCharacters: source.manifest.totalSourceCharacters,
      failedFiles: source.failedFiles, files: Object.values(source.manifest.files).map(({ path, blobSha, lineCount }) => ({ path, blobSha, lineCount })),
    },
    createdAt: created.toISOString(), expiresAt: new Date(created.getTime() + 30 * 86400000).toISOString(),
    metrics: { durationMs: Math.round(performance.now() - start), modelId: evidenceModel().modelId, inputTokens, outputTokens, estimatedModelUsd: 0, rejectedCitations: verified.rejectedCitations },
  };
  onProgress({ phase: "saving" });
  await saveExhibit(result, signal);
  return result;
}
