import "server-only";
import { generateText, Output } from "ai";
import { evidenceModel, modelFailure } from "./client";
import { REQUIREMENTS_INSTRUCTIONS } from "./prompts";
import { RequirementsSchema } from "../evidence/schema";
import { requirementsFromJob } from "../security/validation";
import { AppError } from "../errors";
export async function extractRequirements(job: string, signal: AbortSignal) {
  try {
    const result = await generateText({
      model: evidenceModel().model, instructions: REQUIREMENTS_INSTRUCTIONS,
      prompt: JSON.stringify({ jobDescription: job }),
      output: Output.object({ schema: RequirementsSchema }),
      reasoning: "low", maxOutputTokens: 2000, maxRetries: 0, abortSignal: signal,
    });
    const parsed = RequirementsSchema.parse(result.output);
    const seen = new Set<string>();
    const requirements = requirementsFromJob(parsed.requirements, job).filter(requirement => {
      const key = requirement.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    }).slice(0, 6).map((requirement, i) => ({ ...requirement, id: "REQ-" + String(i + 1).padStart(2, "0") }));
    if (!requirements.length) throw new AppError("NO_REQUIREMENTS", "No source-inspectable technical requirements were found. Add more of the job description.", 422);
    return { title: parsed.title || "Engineering role", requirements, usage: result.usage };
  } catch (error) { if (error instanceof AppError) throw error; modelFailure(error); }
}
