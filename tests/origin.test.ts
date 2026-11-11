import { expect, it } from "vitest";
import { assertSameOrigin } from "../lib/security/origin";

it("accepts the browser host when the Next.js internal request URL uses localhost", () => {
  expect(() => assertSameOrigin(new Request("http://localhost:3000/api/analyze", {
    headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
  }))).not.toThrow();
});

it("accepts the HTTPS origin forwarded to a deployed server", () => {
  expect(() => assertSameOrigin(new Request("http://localhost/api/analyze", {
    headers: { host: "exhibit.example.com", origin: "https://exhibit.example.com", "x-forwarded-proto": "https" },
  }))).not.toThrow();
});

it("rejects cross-site origins and untrusted forwarded host overrides", () => {
  for (const origin of ["https://attacker.example", "http://exhibit.example.com", "null", "https://exhibit.example.com/extra"]) {
    expect(() => assertSameOrigin(new Request("https://exhibit.example.com/api/analyze", {
      headers: { host: "exhibit.example.com", origin, "x-forwarded-host": "attacker.example" },
    }))).toThrow("This request could not be accepted.");
  }
});

it("permits non-browser clients without an Origin header", () => {
  expect(() => assertSameOrigin(new Request("https://exhibit.example.com/api/analyze"))).not.toThrow();
});
