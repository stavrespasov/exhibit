# EXHIBIT

**Proof beats promises.**

Turn one public GitHub repository and a job description into a shareable collection of source-linked engineering evidence.

## Project status

Implementation is starting. This repository currently contains the product contract and implementation plan; it is not a working deployed application yet.

## The core loop

1. Paste a public GitHub repository and a job description.
2. Inspect implementation observations, partial evidence, and evidence not observed.
3. Open syntax-highlighted source and exact GitHub lines at the inspected commit.
4. Share a read-only result.

No accounts, payments, private repositories, or candidate scores.

## Trust contract

- Source references must resolve to files actually inspected at one immutable commit.
- Positive and partial claims must retain at least one valid citation.
- The server verifies file IDs, integer line ranges, and exact quoted text.
- Dependency declarations and README claims alone do not establish implementation.
- Source correspondence does not prove semantic correctness, authorship, production readiness, or personal expertise.
- Results describe the bounded set of inspected files and disclose missing or truncated coverage.
- Only server-validated output can be persisted and shared.

## Planned stack

Next.js App Router, TypeScript, Tailwind CSS, customized accessible UI primitives, Motion for React, Lucide, Shiki, a configurable structured-output model through Vercel AI Gateway, Zod, Supabase PostgreSQL, Vitest, and Playwright.

## MVP limits

| Input or resource | Limit |
| --- | --- |
| Job description | 8,000 characters |
| Extracted requirements | 6 |
| Inspected source files | 12 |
| Individual source file | 24 KiB |
| Source text supplied to the model | 80,000 characters |
| Evidence cards | 8 |
| GitHub fetch concurrency | 4 |
| Application analysis budget | 45 seconds |
| Share-link lifetime | 30 days |

These are engineering limits and targets, not measured performance claims.

See [the implementation plan](docs/IMPLEMENTATION.md) for build order and release gates.
