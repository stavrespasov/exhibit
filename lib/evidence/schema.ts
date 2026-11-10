import { z } from "zod";
export const RequirementSchema = z.object({
  id: z.string().regex(/^REQ-\d{2}$/),
  name: z.string().min(3).max(120),
  sourceQuote: z.string().min(8).max(500),
  keywords: z.array(z.string().min(2).max(60)).min(1).max(8),
  category: z.enum(["frontend", "backend", "data", "testing", "infrastructure", "other"]),
});
export const RequirementsSchema = z.object({
  title: z.string().max(120),
  requirements: z.array(RequirementSchema).min(1).max(6),
});
export const CitationSchema = z.object({
  fileId: z.string().regex(/^FILE-\d{2}$/),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  exactQuote: z.string().min(12).max(2000),
});
export const CandidateCardSchema = z.object({
  requirementId: z.string().regex(/^REQ-\d{2}$/),
  status: z.enum(["supported", "partial", "not_observed"]),
  title: z.string().min(3).max(140),
  explanation: z.string().max(700),
  citations: z.array(CitationSchema).max(3),
  limitations: z.array(z.string().max(240)).max(4),
});
export const CandidatesSchema = z.object({ cards: z.array(CandidateCardSchema).max(8) });
export type Requirement = z.infer<typeof RequirementSchema>;
export type CandidateCard = z.infer<typeof CandidateCardSchema>;
export type Citation = z.infer<typeof CitationSchema>;
export type SourceFile = { path: string; blobSha: string; content: string; lineCount: number };
export type SourceManifest = {
  owner: string; repo: string; commitSha: string; inspectedAt: string;
  filesDiscovered: number; filesInspected: number; treeTruncated: boolean;
  budgetReached: boolean; excludedFiles: number; totalSourceCharacters: number;
  files: Record<string, SourceFile>;
};
export type VerifiedCitation = Citation & {
  filePath: string; blobSha: string; commitSha: string; excerpt: string;
  excerptSha256: string; githubUrl: string;
};
export type VerifiedCard = Omit<CandidateCard, "citations"> & {
  id: string; citations: VerifiedCitation[]; validationNote?: string;
};
