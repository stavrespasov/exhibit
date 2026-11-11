import "server-only";
import { google } from "@ai-sdk/google";
import { NoObjectGeneratedError } from "ai";
import { AppError } from "../errors";
import { FREE_MODELS, providerQuota, providerStatus, type FreeModelId } from "./availability";
export function evidenceModel(selected?: FreeModelId) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new AppError("SETUP_REQUIRED", "EXHIBIT is being set up. Please try again shortly.", 503);
  const modelId = selected ?? process.env.AI_MODEL ?? "gemini-3.6-flash";
  // Free-only deployment: never fall back to Gateway or a paid-only model.
  if (!FREE_MODELS.includes(modelId as FreeModelId)) {
    throw new AppError("MODEL_CONFIGURATION", "Generation is temporarily unavailable.", 503);
  }
  return { model: google(modelId), modelId: modelId as FreeModelId };
}
export function modelFailure(error: unknown, phase: "requirements" | "evidence", modelId?: string): never {
  const status = providerStatus(error);
  const quota = status === 429 ? providerQuota(error) : undefined;
  let cause: unknown = error;
  let issues: { path: string; code: unknown; maximum: unknown; minimum: unknown }[] | undefined;
  for (let depth = 0; depth < 5 && cause && typeof cause === "object"; depth++) {
    if ("issues" in cause && Array.isArray(cause.issues)) {
      issues = cause.issues.map(issue => ({ path: Array.isArray(issue.path) ? issue.path.join(".") : "", code: issue.code, maximum: issue.maximum, minimum: issue.minimum }));
      break;
    }
    cause = "cause" in cause ? cause.cause : undefined;
  }
  console.warn("EXHIBIT_MODEL_FAILURE", {
    phase, status, modelId, quota,
    kind: NoObjectGeneratedError.isInstance(error) ? "structured_output" : "provider_request",
    finishReason: NoObjectGeneratedError.isInstance(error) ? error.finishReason : undefined,
    validationIssues: issues,
  });
  if (status === 429) throw new AppError("FREE_LIMIT", quota?.kind === "daily"
    ? "Google's free daily allowance is used up. It resets at midnight Pacific time. Your inputs are preserved."
    : "Google is limiting free AI requests right now. Your inputs are preserved; please wait before retrying.", 429, quota?.retryAfter);
  throw new AppError("MODEL_UNAVAILABLE", "The AI service couldn't complete this analysis. Your inputs are preserved so you can retry.", 503);
}
