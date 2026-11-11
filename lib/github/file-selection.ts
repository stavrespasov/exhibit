import type { Requirement } from "../evidence/schema";
export type TreeEntry = { path: string; mode: string; type: string; sha: string; size?: number };
const excluded = /(?:^|\/)(?:node_modules|vendor|dist|build|coverage|\.next|\.git|fixtures|__snapshots__)(?:\/|$)|(?:^|\/)\.env|(?:lock\.|[-.]lock$)|\.min\.[jt]s$|\.map$|(?:credentials|secrets?|private[-_]?key)\./i;
const supported = /\.(?:[cm]?[jt]sx?|sql|prisma|ya?ml)$|(?:^|\/)(?:package|tsconfig)\.json$/i;
export function eligibleFile(file: TreeEntry): boolean {
  return file.type === "blob" && file.mode !== "120000" && !excluded.test(file.path) && supported.test(file.path) &&
    (file.size ?? 0) > 0 && (file.size ?? Infinity) <= 24 * 1024;
}
export function rankFiles(files: TreeEntry[], requirements: Requirement[]): TreeEntry[] {
  const terms = [...new Set(requirements.flatMap(r => r.keywords.map(k => k.toLowerCase())))];
  function score(file: TreeEntry) {
    const path = file.path.toLowerCase();
    let value = path === "package.json" ? 4 : 0;
    for (const term of terms) if (path.includes(term)) value += 5;
    if (/(?:^|\/)(?:src|app|lib|pages|components|api|server)\//.test(path)) value += 2;
    if (/\.(?:test|spec)\.[jt]sx?$/.test(path)) value += 2;
    if (/\.(?:ts|tsx|sql|prisma)$/.test(path)) value += 1;
    return value;
  }
  return [...files].sort((a, b) => score(b) - score(a) || a.path.localeCompare(b.path)).slice(0, 12);
}
export function containsLikelyCredential(content: string): boolean {
  return /(?:gh[pousr]_[A-Za-z0-9]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{40,}|sb_secret_[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}|AQ\.[A-Za-z0-9_-]{30,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/.test(content);
}
