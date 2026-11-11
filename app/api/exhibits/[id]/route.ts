import { getExhibit } from "@/lib/storage/exhibits";
export const dynamic = "force-dynamic";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const exhibit = await getExhibit(id);
    if (!exhibit) return Response.json({ message: "This Exhibit is unavailable or its link has expired." }, { status: 404 });
    return Response.json(exhibit, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
  } catch {
    return Response.json({ message: "This Exhibit is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
