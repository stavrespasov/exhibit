import { createHash } from "node:crypto";
import { CandidateCardSchema, CitationSchema, type Requirement, type SourceManifest, type VerifiedCard, type VerifiedCitation } from "./schema";
import { sourceUrl } from "./citations";
type Invalid = { valid: false; reason: "INVALID_SCHEMA" | "UNKNOWN_FILE" | "INVALID_RANGE" | "QUOTE_MISMATCH" | "TRIVIAL_QUOTE" };
type Valid = { valid: true; citation: VerifiedCitation };
export function verifyCitation(input: unknown, manifest: SourceManifest): Invalid | Valid {
  const parsed = CitationSchema.safeParse(input);
  if (!parsed.success) return { valid: false, reason: "INVALID_SCHEMA" };
  const citation = parsed.data;
  const file = manifest.files[citation.fileId];
  if (!file) return { valid: false, reason: "UNKNOWN_FILE" };
  const lines = file.content.replace(/\r\n?/g, "\n").split("\n");
  if (citation.endLine < citation.startLine || citation.endLine > lines.length || citation.endLine - citation.startLine > 100) return { valid: false, reason: "INVALID_RANGE" };
  const excerpt = lines.slice(citation.startLine - 1, citation.endLine).join("\n");
  const quote = citation.exactQuote.replace(/\r\n?/g, "\n");
  if (quote.trim().length < 12 || !/[A-Za-z_$][A-Za-z0-9_$]{2,}/.test(quote)) return { valid: false, reason: "TRIVIAL_QUOTE" };
  if (!excerpt.includes(quote)) return { valid: false, reason: "QUOTE_MISMATCH" };
  return { valid: true, citation: {
    ...citation, exactQuote: quote, filePath: file.path, blobSha: file.blobSha, commitSha: manifest.commitSha,
    excerpt, excerptSha256: createHash("sha256").update(excerpt).digest("hex"),
    githubUrl: sourceUrl(manifest.owner, manifest.repo, manifest.commitSha, file.path, citation.startLine, citation.endLine),
  } };
}
function documentationOnly(path: string): boolean {
  return /(?:^|\/)(?:readme[^/]*|package\.json|[^/]*lock[^/]*|tsconfig[^/]*\.json)$/i.test(path) || /\.(?:md|mdx|rst|txt)$/i.test(path);
}
export function verifyCards(candidates: unknown[], requirements: Requirement[], manifest: SourceManifest): { cards: VerifiedCard[]; rejectedCitations: number } {
  let rejectedCitations = 0;
  const cards = requirements.map((requirement, index): VerifiedCard => {
    const candidate = candidates.map(item => CandidateCardSchema.safeParse(item)).find(item => item.success && item.data.requirementId === requirement.id);
    const empty: VerifiedCard = {
      id: "EV-" + String(index + 1).padStart(2, "0"), requirementId: requirement.id,
      title: requirement.name, status: "not_observed", explanation: "The inspected files do not establish this requirement.",
      citations: [], limitations: ["Evidence may exist in files outside this bounded inspection."],
    };
    if (!candidate?.success) return empty;
    const proposed = candidate.data;
    if (proposed.status === "not_observed") return { ...empty, limitations: proposed.limitations.length ? proposed.limitations : empty.limitations };
    let citationFailed = false;
    const citations = proposed.citations.flatMap(citation => {
      const checked = verifyCitation(citation, manifest);
      if (!checked.valid) { rejectedCitations++; citationFailed = true; return []; }
      return [checked.citation];
    });
    if (citationFailed || !citations.length) return { ...empty, validationNote: "Candidate source references did not pass validation. The proposed observation was withheld." };
    if (citations.every(citation => documentationOnly(citation.filePath))) return {
      ...empty, validationNote: "Only dependency or documentation references were found; implementation evidence was not established.",
    };
    return { ...proposed, id: empty.id, citations };
  });
  return { cards, rejectedCitations };
}
