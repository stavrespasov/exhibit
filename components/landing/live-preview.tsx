"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Braces, Check, ChevronRight, FileCode2 } from "lucide-react";
export function LivePreview() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  return <div className="preview-wrap">
    <div className="folder-tab"><span className="mono">THE EVIDENCE DOSSIER</span><span>001</span></div>
    <motion.div className="preview-paper" initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .15 }}>
      <div className="preview-top"><span className="mono">EXHIBIT / UNDER THE HOOD</span><span className="small-stamp"><span />SOURCE INSPECTOR</span></div>
      <div className="preview-title">Every claim.<br /><em>A paper trail.</em></div>
      <p className="preview-intro">An observation you can open, inspect, and question.</p>
      <button className={"preview-evidence " + (open ? "is-open" : "")} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="preview-source">
        <span className="preview-evidence-icon"><Braces size={21} /></span>
        <span><strong>Citation integrity</strong><small>A closer look at EXHIBIT’s own verifier.</small></span>
        <ChevronRight size={18} className="preview-chevron" />
      </button>
      <div className={"preview-code " + (open ? "is-expanded" : "")} id="preview-source">
        <div className="preview-code-top"><FileCode2 size={13} /><span>lib/evidence/verifier.ts</span><span className="code-dot" /></div>
        <pre><code><span className="code-muted">{"// Source is checked against fetched code.\n"}</span><span className="code-purple">{"if "}</span>{"(!excerpt.includes(quote)) {\n"}<span className="code-purple">{"  return "}</span>{'{ valid: false, reason: '}<span className="code-green">{'"QUOTE_MISMATCH"'}</span>{" };\n}\n"}<span className="code-muted">{"// Invalid citations never become evidence."}</span></code></pre>
      </div>
      <div className="preview-bottom"><span><Check size={13} /> Code you can inspect</span><button onClick={() => setOpen(!open)}>{open ? "Close source" : "Open source"} <ArrowUpRight size={13} /></button></div>
    </motion.div>
    <div className="preview-caption mono"><span>NOT A SCORE. A SOURCE.</span><span>↖ TRY THE CARD</span></div>
  </div>;
}
