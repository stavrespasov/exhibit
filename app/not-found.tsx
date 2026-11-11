import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return <><Header compact /><main id="main" className="unavailable-page shell"><span className="eyebrow">404 / OUTSIDE THE DOSSIER</span><h1>No evidence of this page.</h1><p>Follow the source trail back to the beginning.</p><Button asChild><Link href="/">Back to EXHIBIT</Link></Button></main></>;
}
