import "server-only";
import { createClient } from "@supabase/supabase-js";
import { AppError } from "../errors";
import { isValidShareId } from "../security/validation";
import type { Exhibit } from "../evidence/result";

export function database(signal?: AbortSignal) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new AppError("SETUP_REQUIRED", "EXHIBIT is being set up. Please try again shortly.", 503);
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store", signal: signal ?? init?.signal ?? AbortSignal.timeout(15000) }) },
  });
}
export async function saveExhibit(result: Exhibit, signal?: AbortSignal) {
  const { error } = await database(signal).from("exhibits").insert({
    id: result.id, repo_owner: result.repository.owner, repo_name: result.repository.name,
    commit_sha: result.repository.commitSha, result, created_at: result.createdAt, expires_at: result.expiresAt,
  });
  if (error) throw new AppError("SAVE_FAILED", "The analysis finished, but its link couldn't be saved. Please retry.", 503);
}
export async function getExhibit(id: string): Promise<Exhibit | null> {
  if (!isValidShareId(id)) return null;
  const { data, error } = await database().from("exhibits").select("result,expires_at").eq("id", id).gt("expires_at", new Date().toISOString()).maybeSingle();
  if (error) throw new AppError("STORE_UNAVAILABLE", "This Exhibit is temporarily unavailable. Please try again.", 503);
  if (!data || new Date(data.expires_at).getTime() <= Date.now()) return null;
  const result = data.result as Exhibit;
  if (result?.schemaVersion !== 1 || !Array.isArray(result.cards) || result.id !== id) return null;
  return result;
}
