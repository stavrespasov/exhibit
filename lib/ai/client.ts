import "server-only";
import { google } from "@ai-sdk/google";
import { NoObjectGeneratedError } from "ai";
import { AppError } from "../errors";
export function evidenceModel() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) throw new AppError("SETUP_REQUIRED", "EXHIBIT is being set up. Please try again shortly.", 503);
  const modelId = process.env.AI_MODEL ?? "gemini-3.6-flash";
  // Free-only deployment: never fall back to Gateway or a paid-only model.
  if (!["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"].includes(modelId)) {
    throw new AppError("MODEL_CONFIGURATION", "Generation is temporarily unavailable.", 503);
  }
  return { model: google(modelId), modelId };
}
export function modelFailure(error: unknown, phase: "requirements" | "evidence"): never {
  const status = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 0;
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
    phase, status,
    kind: NoObjectGeneratedError.isInstance(error) ? "structured_output" : "provider_request",
    finishReason: NoObjectGeneratedError.isInstance(error) ? error.finishReason : undefined,
    validationIssues: issues,
  });
  if (status === 429) throw new AppError("FREE_LIMIT", "The free AI allowance is temporarily exhausted. Try again later; your inputs are preserved.", 429, 60);
  throw new AppError("MODEL_UNAVAILABLE", "The AI service couldn't complete this analysis. Your inputs are preserved so you can retry.", 503);
}
