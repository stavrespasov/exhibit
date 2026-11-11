# Verification report

Updated: 11 November 2026

## Automated checks completed

- Vitest: 3 test files, 33 tests passed.
- Next.js production build and TypeScript validation passed.
- Playwright: all 8 desktop/mobile scenarios passed across the initial run and the targeted rerun after correcting an ambiguous alert selector. Six scenarios passed initially; the two affected error-recovery scenarios passed on rerun.

Unit coverage includes strict repository URLs and input boundaries; exact job quotations; invalid, fractional, and out-of-bounds citations; CRLF normalization; immutable source links; dependency-only evidence; file selection, credential exclusion, and size limits. A card with any invalid proposed citation fails closed, including mixed valid/invalid citation sets. These checks establish source correspondence, not the correctness of a model's interpretation.

Browser coverage at 1440px and 375px includes the landing interaction, sample input, preserved inputs after a provider-limit error, a real database-backed report, the source inspector, clipboard sharing opened in a fresh browser context, expired-report 404, malformed-repository 422, and horizontal overflow checks. The tested pages produced no JavaScript errors.

Browser reports were explicitly labeled synthetic QA fixtures, inserted into Supabase for the test and deleted on teardown. The provider-limit response was intercepted in the browser. These tests do **not** establish a successful live GitHub-to-model analysis. Desktop landing and mobile report screenshots were visually reviewed.

## Database and server access

Both migrations are applied to the designated EXHIBIT project. Privilege inspection confirmed RLS enabled, no browser-role table access, and server-role access. The rate-limit RPC is restricted to the server role and uses hashed IP keys rather than raw addresses.

- SQL transaction insert/read/expiry checks passed and rolled back.
- A rate-limit transaction allowed five requests and rejected the sixth, then rolled back.
- The saved Development server key was validated against the Supabase REST API with HTTP 200.
- Browser fixture insert, application server read, report rendering, expiry handling, and fixture deletion succeeded through the HTTP data path.

The security advisor's informational RLS-without-policy notice is intentional for server-only tables; browser roles have no table privileges or access policies.

## Model provider and release limits

An earlier AI Gateway probe returned HTTP 403 because billing verification was required. The application now calls Google Gemini directly under the intended free, unbilled configuration, with no Gateway or paid-provider fallback. No live Gemini result has been received yet.

Still unverified:

- Complete public GitHub → Gemini → citation verification → persisted result flow.
- Human review of real generated semantic claims and a genuine public example.
- Measured model latency, token usage, and free-project quota behavior.
- Public deployment and GitHub source publication.

The current GitHub credential rejected repository writes with HTTP 403. Local commits preserve the user's requested identity; publication requires repository write access. A shared source cache keyed by commit remains deferred.
