import { z } from "zod";

const ProposalEnvelope = z.object({ cards: z.array(z.unknown()).max(8) });

export function recoverCandidates(text: string | undefined): unknown[] | null {
  if (!text || text.length > 65536) return null;
  try {
    const envelope = ProposalEnvelope.safeParse(JSON.parse(text));
    return envelope.success ? envelope.data.cards : null;
  } catch { return null; }
}
