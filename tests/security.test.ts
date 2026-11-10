import { describe, expect, it } from "vitest";
import { AnalyzeInputSchema, parseRepository, requirementsFromJob } from "../lib/security/validation";
import { sourceUrl } from "../lib/evidence/citations";
describe("repository URL boundary", () => {
  it.each(["https://github.com/alex/project", "https://github.com/alex/project/", "https://github.com/alex/project.git"])("accepts public repository roots", url => {
    expect(parseRepository(url)).toEqual({ owner: "alex", repo: "project" });
  });
  it.each([
    "http://github.com/alex/project", "https://github.com.evil.example/alex/project",
    "https://github.com@evil.example/alex/project", "https://user:pass@github.com/alex/project",
    "https://github.com/alex/project/tree/main", "https://127.0.0.1/project/repo",
    "https://github.com/alex/project?url=http://localhost", "https://github.com/alex/project#main",
    "https://github.com/alex//project", "https://github.com/alex/%2e%2e", "file:///etc/passwd",
  ])("rejects unsupported or attacker-controlled targets", url => expect(() => parseRepository(url)).toThrow());
  it("rejects oversized jobs and unrecognized fields", () => {
    expect(AnalyzeInputSchema.safeParse({ repoUrl: "https://github.com/alex/project", jobDescription: "x".repeat(8001) }).success).toBe(false);
    expect(AnalyzeInputSchema.safeParse({ repoUrl: "https://github.com/alex/project", jobDescription: "x".repeat(200), model: "attacker" }).success).toBe(false);
  });
  it("rejects invented requirement quotations", () => {
    expect(requirementsFromJob([{ sourceQuote: "Use Stripe" }, { sourceQuote: "Invented requirement" }], "Use Stripe to handle payments")).toEqual([{ sourceQuote: "Use Stripe" }]);
  });
  it("rejects mutable refs and traversal paths for citations", () => {
    expect(() => sourceUrl("a", "b", "main", "src/app.ts", 1, 2)).toThrow();
    expect(() => sourceUrl("a", "b", "a".repeat(40), "../secret", 1, 2)).toThrow();
  });
});
