# Verification report

Updated: 11 November 2026

## Free-model quota recovery

Production logs confirmed Google HTTP 429 failures during evidence generation for the reported incident. The original quota response body was not retained, so its exact quota dimension is not established. A later small request and a 9,890-input-token SilberBerg evidence request succeeded; this does not establish unlimited capacity.

Recognized model-specific limits can now switch once to another allowlisted, free-tier-eligible Google model. Shared-project limits, unknown 429 responses, permission errors, and malformed output do not cause model cycling. Daily reset handling follows Pacific midnight, including daylight-saving changes. The form honors HTTP and streamed retry timing, blocks repeated submits during the cooldown, retains inputs, and exposes the real reference example. No automatic resubmission or billing activation is configured.

Vitest: 58 tests across 8 files passed. The production build and TypeScript check passed. Twelve browser cases passed in the initial expanded run; two streamed-error cases then passed after narrowing a test selector to exclude Next.js's route announcer. New coverage includes quota parsing, shared versus model-specific scope, daylight-saving reset boundaries, one alternate only, cancellation, the free-model allowlist, and cooldown expiration without an automatic request.

An integration check simulated the primary model's quota error and made a real request to gemini-3.5-flash-lite for stavrespasov/SilberBerg at commit 881e249812235f2dfc69890915a512adb28f1c40. It inspected 12 files (21,742 source characters), used 9,890 input / 617 output tokens, and produced two source-supported and three unobserved cards with zero rejected citations. The primary quota error in this check was simulated; the alternate response and citation verification were real. The requirements were a test role, not the user's original job description. Per-stage model identifiers are retained in new reports; old reports remain readable.

## Neobrutalist refresh

The landing page, creation form, evidence board, source inspector, and error states use cobalt, off-white, white, and ink, with solid outlines and hard shadows. Primary buttons and the highlighted headline use white on cobalt. Decorative star and floating-sticker graphics were removed, along with emoji-style characters in UI copy. A source scan of all 14 UI/route TypeScript files found no literal emoji characters. Production build and TypeScript validation passed. All 10 desktop/phone browser scenarios passed again against the cobalt production build in 24.2 seconds.

Calculated text/background contrast is 5.93:1 for primary buttons, 8.22:1 on hover, 6.23:1 for secondary body text, and at least 13.97:1 for the three evidence badges. Badge labels and functional icons continue to distinguish evidence states. These color-pair checks do not constitute a full accessibility audit.

The expanded landing preview was checked at 320, 375, 640, 768, 900, 901, 1024, 1280, and 1440 pixels: document width matched viewport width throughout. The creation form, genuine reference board, and mobile source sheet were also visually reviewed. The reference walkthrough was re-recorded from the production build using the genuine stored reference, with no new generation shown.

## Build and automated boundaries

- Production Next.js build and TypeScript validation passed.
- Vitest: 58 tests across 8 files passed.
- The current expanded suite covers 14 desktop/phone cases. See quota-recovery evidence above for its local run.
- The earlier 10-case suite passed against the public production URL, https://exhibit-orcin.vercel.app, in 23.2 seconds. No deployment credentials were injected into the browser.

Unit coverage includes repository and input boundaries, exact citation correspondence, mixed-validity fail-closed behavior, source-file selection, credential exclusion, the 80,000-character model-source budget, same-origin enforcement behind a reverse proxy, streamed-body size and cancellation, bounded provider retries, and safe handling of malformed model proposals. The same model is not immediately retried after HTTP 429; recognized model-specific limits permit one free alternate. A recovered proposal still passes strict card and citation validation; invalid observations are withheld.

The browser suite covers controls waiting for JavaScript readiness, landing interactions, prefilled input, preserved inputs after a provider-limit response, stored report rendering, desktop and mobile source inspection, clipboard sharing opened in a fresh browser context, expired-report 404, invalid-repository 422, and horizontal overflow. The stored QA fixtures are explicitly synthetic and deleted on teardown. A provider-limit response is intercepted; no successful model response is fabricated by those tests.

## Real model and repository runs

These are observed runs, not latency guarantees or semantic-accuracy measurements.

| Repository and pinned commit | Model | Analysis time | Input/output tokens | Result |
| --- | --- | --- | --- | --- |
| shadcn-ui/taxonomy · 298a8857c7128a0d121e7f699dfd729f23b3966d | gemini-3.6-flash | 14.901s | 9,380 / 1,830 | 3 observed, 1 partial, 1 not observed; 0 rejected citations |
| stavrespasov/exhibit · 4d7181673dc765946d3cca16e1bfbef600fb13ef | gemini-3.5-flash-lite | 37.766s | 6,826 / 1,905 | 1 observed, 4 not observed; 3 rejected citations |
| shadcn-ui/taxonomy · same pinned commit, fresh Vercel production run | gemini-3.6-flash | 17.558s | 9,459 / 1,499 | 3 observed, 1 partial, 1 not observed; 8 citations, 0 rejected |

The first complete browser POST took 17.3 seconds including the server's remaining work. All three reports were saved to Supabase and rendered by the application. Their model identifiers and token usage come from actual responses. The deployed configuration uses gemini-3.6-flash; Flash-Lite was an additional verification run.

The taxonomy reference inspected 12 of 136 eligible files and 18,926 source characters. A separate GitHub blob fetch independently confirmed all six cited excerpts, quoted substrings, ranges, commit references, and SHA-256 excerpt hashes. Human review of the five observations found:

- React/Next.js/TypeScript UI structure is visible in the inspected layout and page source.
- Authentication is conservatively partial: API session checks are shown, while complete dashboard protection is not established by the selected files.
- Prisma schema and database update calls support the storage observation.
- Checkout creation and webhook signature construction support the Stripe observation; runtime correctness is not certified.
- Automated behavior tests are not established in the bounded sample. This does not assert their absence elsewhere.

The genuine reference report was then checked in desktop and phone browsers: all six citations could be opened, multi-source tabs worked, the 12-file manifest rendered, Escape closed the phone sheet, copied links opened in fresh browser contexts, and no JavaScript errors or page-wide horizontal overflow were observed.

Those genuine-reference checks were repeated successfully against the public production deployment at both widths, separately from the synthetic regression fixtures. The reference belongs to shadcn-ui; it is labeled as a public reference and establishes no applicant contribution.

## Storage and access

The exhibits and shared rate-limit migrations are applied. RLS is enabled; browser roles have no table access, and reads/writes use the server credential. SQL transaction insert/read/expiry and five-allowed/sixth-rejected quota checks passed and rolled back. The actual server credential's REST path and browser-to-server-to-Supabase path were also verified.

Shared results expire after 30 days. Raw job descriptions and complete source files are not stored in report rows. Only selected excerpts, extracted requirements, and inspection metadata are retained. Keys are server-only and excluded from source control.

## Provider and scope limits

Google returned intermittent HTTP 503 capacity errors during verification. The application keeps the user's inputs, makes only a bounded temporary-error retry, and does not route to a paid provider. Free operation assumes a free, unbilled Google project; the allowlist cannot prevent charges on a billed project.

Source verification establishes correspondence to inspected code. It does not prove the interpretation, authorship, personal expertise, production readiness, or passing tests. The recorded runs are a small sample. A shared source cache remains deferred.

## Deployment verification

Application commit a508b32f8dfda3d8dc68a0c4ff81e0e67ced3e86 built successfully as production deployment dpl_62HAFVE2LPn6fhK92ouYNZPrvNY8. A fresh request exercised Vercel → GitHub → Gemini → citation validation → Supabase save, completed in 18.727 seconds including the streamed response, and produced report VMoDfh6iiuVe1feEjPdS8Q6Ium8. Reading that saved report through the public API returned HTTP 200 with the correct repository and pinned commit.

The tested deployment was promoted to the public production alias. Anonymous browser regression and genuine-reference checks then passed there. `/example` redirects to the genuine, reviewed report NKiL2O_NTr9FoRnMDf6jBykxe5g. Earlier deployed requests encountered handled Google HTTP 503 responses; the later success does not remove that provider-availability limitation.

A production runtime-log query for error/fatal entries from 14:53–15:03 UTC on 11 November returned zero records. This bounded window covers the public browser checks, not the application's entire history.

The current 26.36-second reference walkthrough is a continuous recording of the production build exploring the real reference, source tabs, inspection manifest, sharing, and prefilled creation form. It contains no newly generated analysis. The H.264 MP4 was decoded successfully and includes that disclosure in its footer.

The recorded model-cost estimate is $0 under the intended unbilled free-tier configuration. This is an application estimate, not an independently reconciled Google billing statement. No paid fallback is configured.
