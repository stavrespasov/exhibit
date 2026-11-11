"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Check, Braces, LoaderCircle, LockKeyhole, Plus, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
const sampleRepository = "https://github.com/shadcn-ui/taxonomy";
const sampleJob = "Full-Stack TypeScript Engineer\n\nWe are looking for a developer who can build React interfaces with Next.js and TypeScript. The role involves implementing authentication and protected routes, storing application data with a database and Prisma, and integrating Stripe subscriptions with verified webhook handlers. Experience writing automated tests for application behavior is preferred.";
const steps = [
  ["repository", "Pinning the repository snapshot"],
  ["requirements", "Finding the role’s technical requirements"],
  ["source", "Reading selected source files"],
  ["evidence", "Matching implementation to requirements"],
  ["verification", "Checking every source reference"],
  ["saving", "Saving your shareable Exhibit"],
];
function retryDelay(value: unknown) {
  const seconds = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(90000, Math.ceil(seconds)) : undefined;
}
class AnalysisFailure extends Error {
  constructor(message: string, readonly retryAfter?: number) { super(message); }
}
export function InputForm({ example = false }: { example?: boolean }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const [repo, setRepo] = useState(example ? sampleRepository : "");
  const [job, setJob] = useState(example ? sampleJob : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState("repository");
  const [counts, setCounts] = useState<{ current?: number; total?: number }>({});
  const [progressMessage, setProgressMessage] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [retrySeconds, setRetrySeconds] = useState(0);
  useEffect(() => {
    if (!retryAt) return;
    const update = () => {
      const remaining = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000));
      setRetrySeconds(remaining);
      if (!remaining) setRetryAt(0);
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  const abort = useRef<AbortController | null>(null);
  const router = useRouter();
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || retrySeconds > 0) return;
    setError(""); setBusy(true); setPhase("repository"); setCounts({}); setProgressMessage("");
    abort.current = new AbortController();
    let completed = false;
    try {
      const response = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repo.trim(), jobDescription: job.trim() }), signal: abort.current.signal,
      });
      if (!response.ok) { const failure = await response.json(); throw new AnalysisFailure(failure.message ?? "This inspection could not be started.", retryDelay(failure.retryAfter ?? response.headers.get("Retry-After"))); }
      if (!response.body) throw new Error("The inspection connection was interrupted. Please retry.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = "";
      function handle(line: string) {
        if (!line.trim()) return;
        const event = JSON.parse(line);
        if (event.type === "error") throw new AnalysisFailure(event.message, retryDelay(event.retryAfter));
        if (event.type === "progress") { setPhase(event.phase); setCounts({ current: event.current, total: event.total }); if (typeof event.message === "string") setProgressMessage(event.message.slice(0, 200)); }
        if (event.type === "complete" && typeof event.id === "string") { completed = true; setPhase("opening"); router.push("/e/" + encodeURIComponent(event.id)); }
      }
      while (true) {
        const { done, value } = await reader.read();
        pending += decoder.decode(value, { stream: !done });
        const lines = pending.split("\n"); pending = lines.pop() ?? "";
        for (const line of lines) handle(line);
        if (done) { if (pending.trim()) handle(pending); break; }
      }
      if (!completed) throw new Error("The inspection ended before a result was saved. Please retry.");
    } catch (failure) {
      const cancelled = failure instanceof Error && failure.name === "AbortError";
      setError(cancelled ? "Inspection cancelled. Your inputs are still here." : failure instanceof Error ? failure.message : "Please try again.");
      if (failure instanceof AnalysisFailure && failure.retryAfter) {
        setRetrySeconds(failure.retryAfter);
        setRetryAt(Date.now() + failure.retryAfter * 1000);
      }
    } finally { if (!completed) setBusy(false); }
  }
  const active = steps.findIndex(step => step[0] === phase);
  const retryLabel = retrySeconds >= 3600 ? Math.ceil(retrySeconds / 3600) + "h" : retrySeconds >= 60 ? Math.ceil(retrySeconds / 60) + "m" : retrySeconds + "s";
  return <div className="create-grid">
    <form className="input-panel" onSubmit={submit}>
      <div className="input-panel-top"><span className="mono">NEW EXHIBIT / 001</span><span><LockKeyhole size={12} />No account required</span></div>
      <div className="field-group"><label htmlFor="repository"><span className="field-number">01</span>Your public repository</label><p>The project you want your work to speak through.</p><div className="repository-input"><Braces size={18} /><input id="repository" type="url" placeholder="https://github.com/you/your-project" value={repo} onChange={event => setRepo(event.target.value)} required maxLength={250} disabled={!ready || busy} autoComplete="off" spellCheck={false} /></div></div>
      <div className="input-divider"><Plus size={13} /></div>
      <div className="field-group"><label htmlFor="job"><span className="field-number">02</span>The job description</label><p>Paste the role and its technical requirements.</p><textarea id="job" placeholder="We’re looking for a developer who..." value={job} onChange={event => setJob(event.target.value)} required minLength={120} maxLength={8000} rows={9} disabled={!ready || busy} /><div className="field-meta"><button type="button" onClick={() => { setRepo(sampleRepository); setJob(sampleJob); setError(""); }} disabled={!ready || busy}>Try a public example <ArrowUpRight size={12} /></button><span>{job.length.toLocaleString()} / 8,000</span></div></div>
      {error && <div className="form-error" role="alert"><AlertCircle size={17} /><div><p>{error}</p>{retryAt > 0 && <p className="retry-time">Retry after {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(retryAt))}.</p>}<Link href="/example">Explore a real example<ArrowUpRight size={13} /></Link></div></div>}
      <div className="submit-row"><Button type="submit" disabled={!ready || busy || retrySeconds > 0 || !repo.trim() || job.trim().length < 120}>{busy ? <><LoaderCircle size={17} className="spin" />{phase === "opening" ? "Opening your Exhibit" : "Building your Exhibit"}</> : retrySeconds > 0 ? <>Try again in {retryLabel}</> : <>Build my Exhibit<ArrowUpRight size={17} /></>}</Button>{busy && <Button type="button" variant="quiet" onClick={() => abort.current?.abort()}><X size={15} />Cancel</Button>}</div>
      <p className="consent-note">Selected source and job text go to Gemini’s free tier, where content may be used to improve Google products. Use public material. Anyone with your result link can view its selected excerpts and requirements for 30 days.</p>
    </form>
    <aside className="create-aside">
      {busy ? <div className="progress-panel" aria-live="polite"><span className="eyebrow">FOLLOWING THE SOURCE TRAIL</span><h2>Good evidence<br />takes <em>a closer look.</em></h2><ol>{steps.map(([id, label], i) => <li key={id} className={phase === "opening" || i < active ? "done" : i === active ? "active" : ""}><span className="progress-marker">{phase === "opening" || i < active ? <Check size={12} /> : i === active ? <LoaderCircle size={12} className="spin" /> : String(i + 1).padStart(2,"0")}</span><span>{label}{id === "source" && phase === "source" && counts.total ? <small>{counts.current ?? 0} of {counts.total} selected files read</small> : null}</span></li>)}</ol><p className="aside-note">{progressMessage || "Actual processing stages. References are checked before a positive card is shown."}</p></div> :
      <><span className="eyebrow">WHAT YOU’LL WALK AWAY WITH</span><h2>A focused case<br />for <em>your work.</em></h2><div className="aside-feature"><span className="mini-index">01</span><div><h3>Relevant implementation</h3><p>Up to six technical requirements connected to the code that helps establish them.</p></div></div><div className="aside-feature"><span className="mini-index">02</span><div><h3>Every source, a click away</h3><p>Real excerpts, original line numbers, and links pinned to the inspected commit.</p></div></div><div className="aside-feature"><span className="mini-index">03</span><div><h3>The gaps, too</h3><p>Partial and missing evidence stays visible. Your Exhibit makes its limits clear.</p></div></div><p className="aside-note">One public JS/TS repository. Up to twelve source files. No candidate score. No authorship claim.</p></>}
    </aside>
  </div>;
}
