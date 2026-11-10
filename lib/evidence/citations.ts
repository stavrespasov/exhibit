export function sourceUrl(owner: string, repo: string, commitSha: string, path: string, start: number, end: number): string {
  if (!/^[0-9a-f]{40}$/.test(commitSha)) throw new Error("A full immutable commit SHA is required.");
  if (!path || path.startsWith("/") || path.split("/").some(segment => !segment || segment === "." || segment === "..")) throw new Error("Invalid repository-relative path.");
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) throw new Error("Invalid source interval.");
  return "https://github.com/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo) +
    "/blob/" + commitSha + "/" + path.split("/").map(encodeURIComponent).join("/") + "#L" + start + "-L" + end;
}
