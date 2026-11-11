import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { InputForm } from "@/components/create/input-form";
export const metadata: Metadata = { title: "Build your Exhibit", robots: { index: false, follow: false } };
export default async function CreatePage({ searchParams }: { searchParams: Promise<{ example?: string }> }) {
  const parameters = await searchParams;
  return <><Header compact /><main id="main" className="create-page shell"><div className="create-heading"><span className="eyebrow">YOUR WORK, IN CONTEXT</span><h1>Let’s make <em>your case.</em></h1><p>Bring the code. Tell us the role. Follow the evidence.</p></div><InputForm example={parameters.example === "1"} /></main><Footer /></>;
}
