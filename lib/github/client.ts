import "server-only";
import { AppError } from "../errors";
const API = "https://api.github.com";
export async function github<T>(path: string, signal: AbortSignal, maxBytes = 3 * 1024 * 1024): Promise<T> {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "EXHIBIT-evidence" };
  if (token) headers.Authorization = "Bearer " + token;
  let response: Response;
  try { response = await fetch(API + path, { headers, signal, redirect: "error", cache: "no-store" }); }
  catch { throw new AppError("GITHUB_UNAVAILABLE", "GitHub could not be reached. Your inputs are preserved.", 503); }
  if (response.status === 404) throw new AppError("REPOSITORY_UNAVAILABLE", "We couldn't read this as a public GitHub repository. Check the repository URL.", 404);
  if (response.status === 403 || response.status === 429) {
    const retry = response.headers.get("retry-after");
    throw new AppError("GITHUB_LIMIT", "GitHub is temporarily limiting requests. Try again later or explore the example.", 429, retry ? Number(retry) : 60);
  }
  if (!response.ok || !response.body) throw new AppError("GITHUB_UNAVAILABLE", "GitHub couldn't complete this inspection. Please try again.", 503);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new AppError("REPOSITORY_TOO_LARGE", "This repository exceeds the current inspection limits. Try a smaller project.", 422); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T; }
  catch { throw new AppError("GITHUB_RESPONSE", "GitHub returned an unreadable response. Please retry.", 503); }
}
