import "server-only";
import { generateText, Output } from "ai";
import { evidenceModel, modelFailure } from "./client";
import { EVIDENCE_INSTRUCTIONS } from "./prompts";
import { CandidatesSchema, type Requirement } from "../evidence/schema";
export async function proposeEvidence(requirements: Requirement[], files: { fileId: string; path: string; numberedSource: string }[], signal: AbortSignal) {
  try {
    const result = await generateText({
      model: evidenceModel().model, instructions: EVIDENCE_INSTRUCTIONS,
      prompt: JSON.stringify({ requirements, files }),
      output: Output.object({ schema: CandidatesSchema }),
      reasoning: "low", maxOutputTokens: 4500, maxRetries: 0, abortSignal: signal,
    });
    return { cards: CandidatesSchema.parse(result.output).cards, usage: result.usage };
  } catch (error) { modelFailure(error); }
}
