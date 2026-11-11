import "server-only";
import { generateText, NoObjectGeneratedError, Output } from "ai";
import { evidenceModel, modelFailure } from "./client";
import { EVIDENCE_INSTRUCTIONS } from "./prompts";
import { CandidatesSchema, type Requirement } from "../evidence/schema";
import { withTemporaryRetry } from "./request";
import { recoverCandidates } from "./recovery";
import { withFreeModel, type FreeModelId } from "./availability";
export async function proposeEvidence(requirements: Requirement[], files: { fileId: string; path: string; numberedSource: string }[], signal: AbortSignal, preferred?: FreeModelId, onFallback?: () => void) {
  let modelId = evidenceModel(preferred).modelId;
  try {
    const result = await withFreeModel(modelId, selected => {
      modelId = selected;
      return withTemporaryRetry(() => generateText({
        model: evidenceModel(selected).model, instructions: EVIDENCE_INSTRUCTIONS,
        prompt: JSON.stringify({ requirements, files }),
        output: Output.object({ schema: CandidatesSchema }),
        reasoning: "minimal", maxOutputTokens: 3000, maxRetries: 0, abortSignal: signal,
      }), signal);
    }, signal, alternate => {
      console.warn("EXHIBIT_FREE_MODEL_SWITCH", { phase: "evidence", from: modelId, to: alternate });
      onFallback?.();
    });
    return { cards: CandidatesSchema.parse(result.output).cards, usage: result.usage, modelId };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.finishReason === "stop") {
      const cards = recoverCandidates(error.text);
      if (cards) {
        // Every candidate still passes the independent strict card/citation
        // verifier. A malformed proposal becomes not_observed, never evidence.
        console.warn("EXHIBIT_CANDIDATE_REVALIDATION", { candidates: cards.length });
        return { cards, usage: error.usage ?? { inputTokens: undefined, outputTokens: undefined }, modelId };
      }
    }
    modelFailure(error, "evidence", modelId);
  }
}
