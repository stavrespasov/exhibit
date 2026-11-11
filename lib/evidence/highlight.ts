import "server-only";
import { codeToTokens, type BundledLanguage } from "shiki";
import type { Exhibit } from "./result";
export type SourceToken = { content: string; color?: string };
export type HighlightMap = Record<string, SourceToken[][]>;
export async function highlightSources(exhibit: Exhibit): Promise<HighlightMap> {
  const entries = await Promise.all(exhibit.cards.flatMap(card => card.citations.map(async (citation, i) => {
      const extension = citation.filePath.split(".").pop()?.toLowerCase() ?? "";
      const language = ({ ts: "typescript", tsx: "tsx", js: "javascript", jsx: "jsx", json: "json", sql: "sql", prisma: "prisma", yaml: "yaml", yml: "yaml" } as Record<string, BundledLanguage>)[extension] ?? "text";
      try {
        const result = await codeToTokens(citation.excerpt, { lang: language, theme: "github-dark" });
        return [card.id + ":" + i, result.tokens.map(line => line.map(token => ({ content: token.content, color: token.color })))] as const;
      } catch { return [card.id + ":" + i, citation.excerpt.split("\n").map(line => [{ content: line }])] as const; }
  })));
  return Object.fromEntries(entries);
}
