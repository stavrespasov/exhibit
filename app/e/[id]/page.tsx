import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { EvidenceBoard } from "@/components/exhibit/evidence-board";
import { getExhibit } from "@/lib/storage/exhibits";
import { highlightSources } from "@/lib/evidence/highlight";
import { Button } from "@/components/ui/button";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Engineering evidence", robots: { index: false, follow: false } };
export default async function ExhibitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let result;
  let unavailable = false;
  try { result = await getExhibit(id); } catch { unavailable = true; }
  if (!result) return <><Header compact /><main id="main" className="unavailable-page shell"><span className="eyebrow">THE SOURCE TRAIL ENDS HERE</span><h1>{unavailable ? "Temporarily unavailable." : "This Exhibit isn’t available."}</h1><p>{unavailable ? "The result store couldn't be reached. Please try this link again shortly." : "Its link may have expired, or the address may be incomplete. Shared Exhibits are available for 30 days."}</p><Button asChild><Link href="/create">Build a new Exhibit <span aria-hidden="true">↗</span></Link></Button></main><Footer /></>;
  const highlights = await highlightSources(result);
  return <><Header compact /><EvidenceBoard exhibit={result} highlights={highlights} isExample={id === process.env.SAMPLE_EXHIBIT_ID} /><Footer /></>;
}
