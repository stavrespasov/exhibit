# EXHIBIT

**Proof beats promises.**

Turn one public GitHub repository and a job description into a shareable collection of source-linked engineering evidence.

## The core loop

1. Paste a public repository and a job description.
2. Inspect implementation observations, partial evidence, and requirements not observed.
3. Open highlighted source and exact GitHub lines at the inspected commit.
4. Share a read-only result that expires after 30 days.

No accounts, private repositories, payments, or candidate scores.

## Trust contract

- References resolve to inspected files pinned to one immutable commit.
- The server checks file IDs, integer line ranges, and quoted source text. Any invalid citation downgrades its proposed card and removes its positive explanation.
- Dependency declarations and documentation alone do not establish implementation.
- Source correspondence does not establish semantic correctness, code authorship, production readiness, or personal expertise.
- Every result discloses its bounded inspection, omitted coverage, and interpretation limits.
- Only server-validated output is persisted. Raw job descriptions and complete source files are not stored in the report table.

## Stack

Next.js App Router, TypeScript, React, Tailwind CSS, Radix Dialog, Motion, Lucide, Shiki, Vercel AI SDK with direct Google Gemini, Zod, Supabase PostgreSQL, Vitest, and Playwright.

## Run locally

Use Node.js 24.x and npm.

```sh
npm ci
cp .env.example .env.local
# Configure the server-only variables in .env.local.
npm run dev
```

Apply the SQL files in `supabase/migrations` to your designated Supabase project in timestamp order. The tables and rate-limit RPC are accessible only to the server role. Never expose `SUPABASE_SECRET_KEY` or the model key through a public environment variable.

Configure a Google AI Studio key from a **free, unbilled project** as `GOOGLE_GENERATIVE_AI_API_KEY`. The default model is `gemini-3.6-flash`. Generation uses Google's API directly; there is no Vercel AI Gateway or paid-provider fallback. Quota errors preserve the user's inputs. A model allowlist cannot prevent charges on a billed Google project: use an unbilled project for the intended free-tier setup.

The UI discloses that selected public source and job text are processed by Gemini and that free-tier content may be used to improve Google's products. Shared reports contain extracted requirements and selected source excerpts.

An optional server-only `GITHUB_TOKEN` increases the public API rate limit. Repository code is inspected as text and never executed.

Set `SAMPLE_EXHIBIT_ID` to a real generated report ID to feature it at `/example`. If that report expires or is unavailable, the example route opens the prefilled creation form. It never substitutes a fabricated result.

Temporary provider HTTP 503 errors receive at most one retry inside the overall 45-second budget. A recognized model-specific Google HTTP 429 can switch once between `gemini-3.6-flash` and `gemini-3.5-flash-lite`; a configured `gemini-3.8-flash` can switch to Flash-Lite. Shared project limits, unknown quota errors, and permission failures do not trigger model switching. No limited model is immediately retried, and no paid provider is used. The report records the successful model for each analysis stage.

If free capacity remains unavailable, the form preserves both inputs, honors provider retry timing, and offers the genuine reference example. Daily Google quotas reset at midnight Pacific time; a short RetryInfo delay is not presented as a daily reset. The form does not automatically resubmit. Complete model JSON proposals still pass independent card and citation validation; malformed candidates are withheld.

```sh
npm test
npm run build
npm start -- --port 3000
# In another terminal, with the same Supabase configuration:
npm run test:e2e
```

Browser tests use `/usr/bin/chromium` by default; set `CHROMIUM_PATH` for another installation. They create clearly labeled synthetic report fixtures in the configured database and delete those fixtures on completion. Use a dedicated test store when available. They do not simulate successful live AI analysis.

## MVP limits

| Resource | Limit |
| --- | --- |
| Job description | 120–8,000 characters |
| Extracted requirements | 6 |
| Inspected source files | 12 |
| Individual source file | 24 KiB |
| Source text supplied to the model | 80,000 characters |
| Evidence cards | 8 |
| GitHub fetch concurrency | 4 |
| Application analysis budget | 45 seconds |
| Share-link lifetime | 30 days |
| Analysis requests | 5 per IP hash per 30 minutes, 50 globally per day |

Limits describe the implementation, not measured latency or quality guarantees. Analysis currently fetches source afresh; a shared commit cache is not implemented.

## Release status

Deployed interface: https://exhibit-orcin.vercel.app

Public source: https://github.com/stavrespasov/exhibit

Reference example: https://exhibit-orcin.vercel.app/example

Reference walkthrough: https://exhibit-orcin.vercel.app/demo.mp4 — a continuous recording of a genuine, previously generated report, source inspection, the manifest, and sharing. It does not depict a new analysis being generated.

The live source-to-report flow has been exercised with public repositories and real Gemini responses, including a fresh Vercel production analysis saved and retrieved from Supabase. The production build and 58 unit tests pass. The expanded desktop/mobile suite covers 14 cases, including cooldown and streamed quota recovery. See the verification report for local and public run evidence. The reference example contains independently rechecked citations and explicitly separates observed, partial, and unobserved requirements.

See the [product brief](docs/PRODUCT_BRIEF.md), [verification report](TEST_REPORT.md), and [narrated walkthrough guide](docs/WALKTHROUGH.md). Google free-tier capacity was intermittent during verification; a successful recorded run is not an availability guarantee.

Deploy the repository root as a Next.js project on Vercel and configure the server variables from `.env.example` for the intended environments. Keep `.env.local`, `.vercel`, browser traces, and authentication files out of source control.
