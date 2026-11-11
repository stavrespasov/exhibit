import "server-only";
import { google } from "@ai-sdk/google";
import { AppError } from "../errors";
export function evidenceModel() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new AppError("SETUP_REQUIRED", "EXHIBIT is being set up. Please try again shortly.", 503);
  const modelId = process.env.AI_MODEL ?? "gemini-3.8-flash";
  // Free-only deployment: never fall back to Gateway or a paid-only model.
  if (!["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"].includes(modelId)) {
    throw new AppError("MODEL_CONFIGURATION", "Generation is temporarily unavailable.", 503);
  }
  return { model: google(modelId), modelId };
}
export function modelFailure(error: unknown): never {
  const status = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
  if (status === 429) throw new AppError("FREE_LIMIT", "The free AI allowance is temporarily exhausted. Try again later; your inputs are preserved.", 429, 60);
  throw new AppError("MODEL_UNAVAILABLE", "The AI service couldn't complete this analysis. Your inputs are preserved so you can retry.", 503);
}
