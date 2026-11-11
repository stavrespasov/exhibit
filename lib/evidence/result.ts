import type { Requirement, VerifiedCard } from "./schema";
export type Exhibit = {
  schemaVersion: 1;
  id: string;
  title: string;
  repository: { owner: string; name: string; description: string; commitSha: string; url: string };
  requirements: Requirement[];
  cards: VerifiedCard[];
  inspection: {
    filesDiscovered: number; filesInspected: number; treeTruncated: boolean; budgetReached: boolean;
    excludedFiles: number; sourceCharacters: number; failedFiles: number;
    files: { path: string; blobSha: string; lineCount: number }[];
  };
  createdAt: string;
  expiresAt: string;
  metrics: { durationMs: number; modelId: string; inputTokens: number; outputTokens: number; estimatedModelUsd: number; rejectedCitations: number };
};
