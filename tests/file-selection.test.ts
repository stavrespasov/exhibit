import { expect, it } from "vitest";
import { containsLikelyCredential, eligibleFile, rankFiles, type TreeEntry } from "../lib/github/file-selection";
const file = (path: string, changes: Partial<TreeEntry> = {}): TreeEntry => ({ path, mode: "100644", type: "blob", sha: "a".repeat(40), size: 500, ...changes });
it("excludes generated content, environment files, symlinks and oversized files", () => {
  for (const path of ["node_modules/a.ts", ".env.local", "dist/app.js", "src/private-key.ts", "app.min.js"]) expect(eligibleFile(file(path))).toBe(false);
  expect(eligibleFile(file("src/api.ts", { size: 25000 }))).toBe(false);
  expect(eligibleFile(file("src/api.ts", { mode: "120000" }))).toBe(false);
  expect(eligibleFile(file("src/api.ts"))).toBe(true);
});
it("prioritizes relevant source deterministically within twelve files", () => {
  const files = [file("src/unrelated.ts"), file("src/stripe/webhook.ts"), ...Array.from({length: 20}, (_,i) => file("src/a" + i + ".ts"))];
  const requirements = [{ id: "REQ-01", name: "Payments", sourceQuote: "Implement Stripe webhooks", keywords: ["stripe", "webhook"], category: "backend" as const }];
  expect(rankFiles(files, requirements)).toHaveLength(12);
  expect(rankFiles(files, requirements)[0].path).toBe("src/stripe/webhook.ts");
});
it("avoids forwarding obvious embedded credentials", () => {
  expect(containsLikelyCredential('const key = "ghp_' + "a".repeat(36) + '";')).toBe(true);
  expect(containsLikelyCredential('const key = process.env.GITHUB_TOKEN;')).toBe(false);
});

it("excludes modern Google and Supabase credentials embedded in source", () => {
  for (const prefix of ["AQ.", "AIza", "sb_secret_"]) {
    expect(containsLikelyCredential('const key = "' + prefix + "x".repeat(48) + '";')).toBe(true);
  }
});
