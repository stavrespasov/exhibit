import "server-only";
import { createHmac } from "node:crypto";
import { ipAddress } from "@vercel/functions";
import { database } from "../storage/exhibits";
import { AppError } from "../errors";
export async function reserveAnalysis(request: Request, signal?: AbortSignal) {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new AppError("SETUP_REQUIRED", "Generation is temporarily unavailable.", 503);
  const ip = ipAddress(request) ?? "local-development";
  const hash = createHmac("sha256", key).update("exhibit-rate-v1:" + ip).digest("hex");
  const { data, error } = await database(signal).rpc("reserve_exhibit_analysis", { p_key: hash });
  if (error) throw new AppError("LIMIT_CHECK_FAILED", "Generation is temporarily unavailable. Please try again.", 503);
  if (data !== true) throw new AppError("APP_LIMIT", "The free generation limit has been reached. Try again later or explore an existing Exhibit.", 429, 1800);
}
