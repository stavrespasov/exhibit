import "server-only";
import { github } from "./client";
import type { TreeEntry } from "./file-selection";
import { AppError } from "../errors";
export type Snapshot = {
  owner: string; name: string; description: string; commitSha: string; treeSha: string;
  tree: TreeEntry[]; treeTruncated: boolean; filesDiscovered: number;
};
export async function snapshot(owner: string, repo: string, signal: AbortSignal): Promise<Snapshot> {
  const root = "/repos/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo);
  const metadata = await github<{ private: boolean; name: string; owner: { login: string }; default_branch: string; description: string | null }>(root, signal, 128 * 1024);
  if (metadata.private) throw new AppError("PUBLIC_ONLY", "EXHIBIT currently supports public repositories only.", 422);
  const canonical = "/repos/" + encodeURIComponent(metadata.owner.login) + "/" + encodeURIComponent(metadata.name);
  const commit = await github<{ sha: string; commit: { tree: { sha: string } } }>(canonical + "/commits/" + encodeURIComponent(metadata.default_branch), signal, 512 * 1024);
  if (!/^[0-9a-f]{40}$/.test(commit.sha)) throw new AppError("INVALID_SNAPSHOT", "This source snapshot could not be verified.", 503);
  const listing = await github<{ tree: TreeEntry[]; truncated: boolean }>(canonical + "/git/trees/" + commit.commit.tree.sha + "?recursive=1", signal);
  return {
    owner: metadata.owner.login, name: metadata.name, description: metadata.description ?? "",
    commitSha: commit.sha, treeSha: commit.commit.tree.sha,
    tree: listing.tree.slice(0, 2000),
    treeTruncated: listing.truncated || listing.tree.length > 2000,
    filesDiscovered: listing.tree.filter(f => f.type === "blob").length,
  };
}
