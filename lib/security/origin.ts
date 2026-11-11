import { AppError } from "../errors";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  try {
    const target = new URL(request.url);
    const forwarded = request.headers.get("x-forwarded-proto");
    const protocol = forwarded === "https" ? "https:" : forwarded === "http" ? "http:" : target.protocol;
    const expected = new URL(protocol + "//" + (request.headers.get("host") ?? target.host));
    const actual = new URL(origin);
    if (actual.origin === expected.origin && !actual.username && !actual.password && actual.pathname === "/" && !actual.search && !actual.hash) return;
  } catch {}
  throw new AppError("ORIGIN", "This request could not be accepted.", 403);
}
