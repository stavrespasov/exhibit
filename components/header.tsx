import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "./ui/button";
export function Mark() {
  return <svg viewBox="0 0 32 32" aria-hidden="true" className="brand-mark"><path d="M11 5H5v22h6M21 5h6v22h-6M12 11h8M12 16h8M12 21h5" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg>;
}
export function Header({ compact = false }: { compact?: boolean }) {
  return <header className="site-header shell">
    <Link className="brand" href="/" aria-label="EXHIBIT home"><Mark /><span>EXHIBIT<span className="brand-period">.</span></span></Link>
    <nav aria-label="Main navigation">
      {!compact && <Link className="nav-text" href="/#how-it-works">How it works</Link>}
      <Button asChild variant={compact ? "secondary" : "primary"} className="header-cta"><Link href="/create">{compact ? "New Exhibit" : "Build your Exhibit"}<ArrowUpRight size={15} /></Link></Button>
    </nav>
  </header>;
}
