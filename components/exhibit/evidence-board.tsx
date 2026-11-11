"use client";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Braces, Check, CheckCheck, ChevronRight, Copy, FileCode2, Files, GitCommitHorizontal, Minus, ScanLine, X } from "lucide-react";
import type { Exhibit } from "@/lib/evidence/result";
import type { HighlightMap } from "@/lib/evidence/highlight";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const labels = { supported: "Source observed", partial: "Partially evidenced", not_observed: "Not observed" };
function utcDate(value: string) { return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)); }
export function EvidenceBoard({ exhibit, highlights, isExample = false }: { exhibit: Exhibit; highlights: HighlightMap; isExample?: boolean }) {
  const [selected, setSelected] = useState(Math.max(0, exhibit.cards.findIndex(card => card.citations.length > 0)));
  const [citationIndex, setCitationIndex] = useState(0);
  const [mobileSource, setMobileSource] = useState(false);
  const [view, setView] = useState<"evidence" | "files">("evidence");
  const [copyState, setCopyState] = useState("");
  const card = exhibit.cards[selected];
  const citation = card?.citations[citationIndex];
  const sourceTokens = highlights[card?.id + ":" + citationIndex];
  const positive = exhibit.cards.filter(item => item.status !== "not_observed").length;
  function inspect(index: number) {
    setSelected(index); setCitationIndex(0);
    if (window.matchMedia("(max-width: 900px)").matches) setMobileSource(true);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(window.location.href); setCopyState("Link copied"); }
    catch { setCopyState("Copy this page’s address to share your Exhibit."); }
  }
  const inspector = <div className="inspector-inner">
    <div className="inspector-top"><span className="eyebrow">THE SOURCE BEHIND THE OBSERVATION</span><Braces size={19} /></div>
    {citation ? <>
      <h2>{card.title}</h2>
      <p className="inspector-explanation">{card.explanation}</p>
      {card.citations.length > 1 && <div className="citation-tabs" aria-label="Cited source files">{card.citations.map((item, i) => <button key={i} onClick={() => setCitationIndex(i)} aria-pressed={i === citationIndex}>{i + 1}. {item.filePath.split("/").pop()}</button>)}</div>}
      <div className="source-file-bar"><FileCode2 size={14} /><span>{citation.filePath}</span><span>L{citation.startLine}–{citation.endLine}</span></div>
      <div className="source-code" tabIndex={0} role="region" aria-label={"Source code from " + citation.filePath}><pre><code>{(sourceTokens ?? citation.excerpt.split("\n").map(line => [{ content: line }])).map((line, i) => <span className="source-line" key={i}><span className="line-number" aria-hidden="true">{citation.startLine + i}</span><span className="line-code">{line.map((token, j) => <span key={j} style={{ color: token.color }}>{token.content}</span>) || " "}</span></span>)}</code></pre></div>
      <div className="source-integrity"><span><CheckCheck size={14} />Excerpt matches inspected source</span><span className="mono">{citation.excerptSha256.slice(0,12)}</span></div>
      <a className="source-github-link" href={citation.githubUrl} target="_blank" rel="noopener noreferrer">Open exact source on GitHub<ArrowUpRight size={16} /></a>
      <div className="source-context"><span className="eyebrow">THE LIMITS OF THIS OBSERVATION</span><ul>{card.limitations.map((limit, i) => <li key={i}>{limit}</li>)}</ul><p>AI interpretation can be wrong even when its source citation matches. Inspect the code and context yourself.</p></div>
    </> : <div className="source-empty"><ScanLine size={34} /><h2>No source established.</h2><p>This requirement was not established in the inspected files. It may be supported elsewhere.</p></div>}
    <div className="inspector-commit"><GitCommitHorizontal size={14} /><span className="mono">COMMIT {exhibit.repository.commitSha.slice(0, 10)}</span><span>Snapshot, not a live branch</span></div>
  </div>;
  return <main id="main" className="exhibit-page shell">
    <div className="dossier-label"><span className="eyebrow">ENGINEERING EVIDENCE / {exhibit.id.slice(0,8).toUpperCase()}</span><span className="mono">PREPARED {utcDate(exhibit.createdAt).toUpperCase()}</span></div>
    {isExample && <p className="example-note">PUBLIC REFERENCE EXAMPLE · Repository by {exhibit.repository.owner}. Applicant contribution is unverified.</p>}
    <section className="dossier-heading"><div><h1>An Exhibit for<br /><em>{exhibit.title}.</em></h1><a className="repo-link" href={exhibit.repository.url} target="_blank" rel="noopener noreferrer"><span className="repo-square"><Braces size={16} /></span>{exhibit.repository.owner}<span>/</span><strong>{exhibit.repository.name}</strong><ArrowUpRight size={14} /></a></div><div className="share-block"><Button onClick={copy}>{copyState === "Link copied" ? <Check size={16} /> : <Copy size={16} />}{copyState === "Link copied" ? "Link copied" : "Copy Exhibit link"}</Button><span>Read-only. No account to open.</span><p role="status" aria-live="polite">{copyState && copyState !== "Link copied" ? copyState : "Link expires " + utcDate(exhibit.expiresAt) + " (UTC)"}</p></div></section>
    <div className="coverage-band"><span className="coverage-icon"><ScanLine size={21} /></span><p><strong>{exhibit.inspection.filesInspected} files inspected</strong><span> of {exhibit.inspection.filesDiscovered} eligible files listed. Findings describe this bounded snapshot.</span></p><span className="coverage-commit mono"><GitCommitHorizontal size={14} />{exhibit.repository.commitSha.slice(0,8)}</span></div>
    {(exhibit.inspection.treeTruncated || exhibit.inspection.failedFiles > 0) && <p className="coverage-warning">{exhibit.inspection.treeTruncated ? "The repository listing was partial. Counts do not represent the complete repository. " : ""}{exhibit.inspection.failedFiles > 0 ? exhibit.inspection.failedFiles + " selected file(s) could not be read." : ""}</p>}
    <div className="board-navigation"><div><button aria-pressed={view === "evidence"} onClick={() => setView("evidence")}>Evidence <span>{exhibit.cards.length}</span></button><button aria-pressed={view === "files"} onClick={() => setView("files")}>Inspection manifest <span>{exhibit.inspection.filesInspected}</span></button></div><span className="mono">{positive} OBSERVED OR PARTIAL / {exhibit.cards.length - positive} NOT ESTABLISHED</span></div>
    <div className="board-grid">
      <section aria-label={view === "evidence" ? "Technical evidence cards" : "Inspected files"} className="evidence-list">
        {view === "evidence" ? exhibit.cards.map((item, i) => {
          const requirement = exhibit.requirements.find(req => req.id === item.requirementId);
          return <article key={item.id} className={cn("evidence-card", item.status, selected === i && "selected")}>
            <div className="evidence-card-top"><span className="mono">{item.id} / {requirement?.category.toUpperCase()}</span><span className={"evidence-status " + item.status}>{item.status === "supported" ? <Check size={11} /> : <Minus size={11} />}{labels[item.status]}</span></div>
            <button className="card-title-button" onClick={() => inspect(i)}><h2>{item.title}</h2>{item.citations.length > 0 && <ChevronRight size={18} />}</button>
            <p>{item.explanation}</p>
            {requirement && <details className="job-quote"><summary>From the job description</summary><blockquote>{requirement.sourceQuote}</blockquote></details>}
            {item.validationNote && <p className="validation-note">{item.validationNote}</p>}
            {item.citations.length ? <button className="card-source-button" onClick={() => inspect(i)}><FileCode2 size={13} /><span>{item.citations[0].filePath}</span><span>L{item.citations[0].startLine}–{item.citations[0].endLine}</span><ArrowUpRight size={13} /></button> : <div className="no-source-label"><ScanLine size={13} />Not established in inspected source</div>}
          </article>;
        }) : <div className="manifest-panel"><span className="eyebrow">WHAT WE ACTUALLY LOOKED AT</span><h2>The inspection manifest.</h2><p>Source files supplied for this analysis, pinned to the same immutable commit. Other files were not evaluated.</p>{exhibit.inspection.files.map(file => <div className="manifest-file" key={file.path}><FileCode2 size={16} /><span>{file.path}<small className="mono">{file.blobSha.slice(0,12)}</small></span><small>{file.lineCount} lines</small></div>)}<div className="manifest-facts"><span>{exhibit.inspection.excludedFiles} entries excluded</span><span>{exhibit.inspection.sourceCharacters.toLocaleString()} source characters</span><span>{exhibit.inspection.budgetReached ? "Selection budget reached" : "Within selection budget"}</span></div></div>}
        <div className="board-limits"><span className="eyebrow">READ THE EVIDENCE, KEEP THE CONTEXT</span><p>Source correspondence is checked. Interpretation is AI-generated. Applicant contribution and code authorship have not been verified.</p><span>{(exhibit.metrics.durationMs / 1000).toFixed(1)}s analysis · {exhibit.metrics.modelId} · configured free-tier allowance</span></div>
      </section>
      <aside className="desktop-inspector" aria-label="Selected source code">{inspector}</aside>
    </div>
    <Dialog.Root open={mobileSource} onOpenChange={setMobileSource}><Dialog.Portal><Dialog.Overlay className="source-sheet-overlay" /><Dialog.Content className="source-sheet"><Dialog.Title className="sr-only">Source inspector</Dialog.Title><Dialog.Description className="sr-only">The source excerpt behind the selected evidence observation.</Dialog.Description><Dialog.Close className="sheet-close" aria-label="Close source inspector"><X size={20} /></Dialog.Close>{inspector}</Dialog.Content></Dialog.Portal></Dialog.Root>
  </main>;
}
