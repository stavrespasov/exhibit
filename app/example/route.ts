import { getExhibit } from "@/lib/storage/exhibits";

export const dynamic = "force-dynamic";
export async function GET() {
  let location = "/create?example=1";
  const id = process.env.SAMPLE_EXHIBIT_ID;
  if (id) {
    try {
      if (await getExhibit(id)) location = "/e/" + encodeURIComponent(id);
    } catch {}
  }
  return new Response(null, { status: 307, headers: { Location: location, "Cache-Control": "no-store" } });
}
