import Link from "next/link";
import { ArrowDown, ArrowUpRight, Check, GitCommitHorizontal, ScanLine, SquareArrowOutUpRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { LivePreview } from "@/components/landing/live-preview";
export default function Home() {
  const example = "/example";
  return <>
    <Header />
    <main id="main">
      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow"><span className="status-dot" />ENGINEERING EVIDENCE, ON RECORD</div>
          <h1>Proof beats<br /><span className="hero-serif">promises.</span><span className="hero-star" aria-hidden="true">✳</span></h1>
          <p className="hero-description">Your work deserves more than a bullet point.<br className="desktop-break" /> Turn a GitHub repository into source-backed evidence for the job you want.</p>
          <div className="hero-actions"><Button asChild><Link href="/create">Build your Exhibit<ArrowUpRight size={18} /></Link></Button><Link href={example} className="text-action">Explore an example <ArrowUpRight size={15} /></Link></div>
          <div className="hero-assurances"><span><Check size={12} />No account</span><span><Check size={12} />Public repositories</span><span><Check size={12} />Every source inspectable</span></div>
        </div>
        <LivePreview />
      </section>
      <div className="thesis-strip"><div className="shell thesis-inner"><span className="mono">THE SHORT VERSION</span><p>You’ve already built the work.<br className="mobile-break" /> <em>Make it easier to see.</em></p><ArrowDown size={19} /></div></div>
      <section className="how-section shell" id="how-it-works">
        <div className="section-intro"><span className="eyebrow">FROM REPOSITORY TO RELEVANCE</span><h2>A little less claiming.<br /><em>A lot more showing.</em></h2><p>Two inputs. One focused collection of evidence.<br />A source trail a reviewer can follow in a click.</p></div>
        <div className="steps-grid">
          <article><span className="step-number mono">01 / PASTE</span><div className="step-art step-art-input"><span><span className="tiny-dot" />github.com/you/your-work</span><span><span className="tiny-dot" />The role you’re applying for <span className="cursor-block" /></span></div><h3>Start with the real thing.</h3><p>A public repository and a job description. Bring the work you want someone to look at.</p></article>
          <article><span className="step-number mono">02 / INSPECT</span><div className="step-art step-art-evidence"><ScanLine size={23} /><span>Implementation → Source → Context</span><span className="art-rule" /></div><h3>Follow the evidence.</h3><p>Open the code behind an observation. See what was inspected, what it shows, and what remains unestablished.</p></article>
          <article><span className="step-number mono">03 / SHARE</span><div className="step-art step-art-share"><SquareArrowOutUpRight size={23} /><span>A read-only link.<br /><strong>No login to open it.</strong></span></div><h3>Send something substantial.</h3><p>A focused, job-specific dossier with source links pinned to the commit that was actually inspected.</p></article>
        </div>
      </section>
      <section className="principle-section shell" id="the-fine-print">
        <div className="principle-title"><GitCommitHorizontal size={22} /><span className="eyebrow">THE INTEGRITY OF THE THING</span><h2>A source for the claim.<br /><em>Room for the limits.</em></h2></div>
        <div className="principle-copy"><p>EXHIBIT checks cited code against an inspected repository snapshot. A dependency is not an implementation. A written test is not a passing test. Missing evidence stays visible.</p><p>It does not verify who wrote the code or certify engineering ability. Every result describes a bounded inspection of up to twelve files.</p><p className="privacy-note">Selected public source and job text are processed by Gemini. Google’s free-tier content may be used to improve its products. Shared results contain selected excerpts and requirements, and expire after 30 days.</p></div>
      </section>
      <section className="closing-section shell"><span className="eyebrow">LET THE WORK SPEAK</span><h2>Make your next application<br /><em>an Exhibit.</em></h2><Button asChild><Link href="/create">Build your Exhibit<ArrowUpRight size={18} /></Link></Button></section>
    </main>
    <Footer />
  </>;
}
