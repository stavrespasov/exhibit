import Link from "next/link";
export function Footer() {
  return <footer className="site-footer shell">
    <span className="mono">EXHIBIT / CODE IS THE CREDENTIAL</span>
    <span>Source correspondence checked. Authorship unverified.</span>
    <Link href="/#the-fine-print">Data &amp; limits</Link>
  </footer>;
}
