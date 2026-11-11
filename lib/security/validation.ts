import { z } from "zod";
import { AppError } from "../errors";
export class InputError extends AppError {
  constructor(message: string) { super("INVALID_REPOSITORY", message, 422); }
}
export function parseRepository(value: string): { owner: string; repo: string } {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new InputError("Enter a public GitHub repository URL."); }
  if (url.protocol !== "https:" || url.hostname.toLowerCase() !== "github.com" || url.port || url.username || url.password || url.search || url.hash) {
    throw new InputError("Use an HTTPS github.com/owner/repository URL, without extra parameters.");
  }
  const parts = url.pathname.replace(/\/$/, "").split("/").filter(Boolean);
  if (parts.length !== 2 || url.pathname.includes("//")) throw new InputError("Use the repository root, without a branch or file path.");
  const [owner, rawRepo] = parts;
  const repo = rawRepo.replace(/\.git$/, "");
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,37}[A-Za-z0-9])?$/.test(owner) ||
      !/^[A-Za-z0-9_.-]{1,100}$/.test(repo) || repo === "." || repo === "..") {
    throw new InputError("That GitHub repository address is not supported.");
  }
  return { owner, repo };
}
export const AnalyzeInputSchema = z.object({
  repoUrl: z.string().min(10).max(250),
  jobDescription: z.string().trim().min(120, "Paste at least a few sentences from the job description.").max(8000),
}).strict();
export function isValidShareId(value: string): boolean { return /^[A-Za-z0-9_-]{22,64}$/.test(value); }
export function requirementsFromJob<T extends { sourceQuote: string }>(requirements: T[], job: string): T[] {
  return requirements.filter(requirement => job.includes(requirement.sourceQuote));
}
