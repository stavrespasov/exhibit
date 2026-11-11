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

Use Node.js 24–26 and npm.

```sh
npm ci
cp .env.example .env.local
# Configure the server-only variables in .env.local.
npm run dev
```

Apply the SQL files in `supabase/migrations` to your designated Supabase project in timestamp order. The tables and rate-limit RPC are accessible only to the server role. Never expose `SUPABASE_SECRET_KEY` or the model key through a public environment variable.

Configure a Google AI Studio key from a **free, unbilled project** as `GOOGLE_GENERATIVE_AI_API_KEY`. The default model is `gemini-3.8-flash`. Generation uses Google's API directly; there is no Vercel AI Gateway or paid-provider fallback. Quota errors preserve the user's inputs. A model allowlist cannot prevent charges on a billed Google project: use an unbilled project for the intended free-tier setup.

The UI discloses that selected public source and job text are processed by Gemini and that free-tier content may be used to improve Google's products. Shared reports contain extracted requirements and selected source excerpts.

An optional server-only `GITHUB_TOKEN` increases the public API rate limit. Repository code is inspected as text and never executed.

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

The app builds, its 33 unit tests pass, and desktop/mobile browser checks pass for the interface, persisted reports, sharing, expiry, validation, and error recovery. Live model generation and a genuinely generated public example still require the free Gemini key and end-to-end verification. See [TEST_REPORT.md](TEST_REPORT.md) for exact coverage and remaining release checks.

Deploy the repository root as a Next.js project on Vercel and configure the server variables from `.env.example` for the intended environments. Keep `.env.local`, `.vercel`, browser traces, and authentication files out of source control.
