# Verification report

Updated: 11 November 2026

## Build and automated boundaries

- Production Next.js build and TypeScript validation passed.
- Vitest: 47 tests across 7 files passed.
- Playwright against the local production build: all 10 scenarios passed at desktop 1440px and phone 375px.

Unit coverage includes repository and input boundaries, exact citation correspondence, mixed-validity fail-closed behavior, source-file selection, credential exclusion, the 80,000-character model-source budget, same-origin enforcement behind a reverse proxy, streamed-body size and cancellation, bounded provider retries, and safe handling of malformed model proposals. HTTP 429 and permission failures are not retried. A recovered proposal still passes strict card and citation validation; invalid observations are withheld.

The browser suite covers controls waiting for JavaScript readiness, landing interactions, prefilled input, preserved inputs after a provider-limit response, stored report rendering, desktop and mobile source inspection, clipboard sharing opened in a fresh browser context, expired-report 404, invalid-repository 422, and horizontal overflow. The stored QA fixtures are explicitly synthetic and deleted on teardown. A provider-limit response is intercepted; no successful model response is fabricated by those tests.

## Real model and repository runs

These are observed runs, not latency guarantees or semantic-accuracy measurements.

| Repository and pinned commit | Model | Analysis time | Input/output tokens | Result |
| --- | --- | --- | --- | --- |
| shadcn-ui/taxonomy · 298a8857c7128a0d121e7f699dfd729f23b3966d | gemini-3.6-flash | 14.901s | 9,380 / 1,830 | 3 observed, 1 partial, 1 not observed; 0 rejected citations |
| stavrespasov/exhibit · 4d7181673dc765946d3cca16e1bfbef600fb13ef | gemini-3.5-flash-lite | 37.766s | 6,826 / 1,905 | 1 observed, 4 not observed; 3 rejected citations |

The first complete browser POST took 17.3 seconds including the server's remaining work. Both reports were saved to Supabase and rendered by the application. Their model identifiers and token usage come from actual responses. The deployed configuration uses gemini-3.6-flash; Flash-Lite was an additional verification run.

The taxonomy reference inspected 12 of 136 eligible files and 18,926 source characters. A separate GitHub blob fetch independently confirmed all six cited excerpts, quoted substrings, ranges, commit references, and SHA-256 excerpt hashes. Human review of the five observations found:

- React/Next.js/TypeScript UI structure is visible in the inspected layout and page source.
- Authentication is conservatively partial: API session checks are shown, while complete dashboard protection is not established by the selected files.
- Prisma schema and database update calls support the storage observation.
- Checkout creation and webhook signature construction support the Stripe observation; runtime correctness is not certified.
- Automated behavior tests are not established in the bounded sample. This does not assert their absence elsewhere.

The genuine reference report was then checked in desktop and phone browsers: all six citations could be opened, multi-source tabs worked, the 12-file manifest rendered, Escape closed the phone sheet, copied links opened in fresh browser contexts, and no JavaScript errors or page-wide horizontal overflow were observed.

## Storage and access

The exhibits and shared rate-limit migrations are applied. RLS is enabled; browser roles have no table access, and reads/writes use the server credential. SQL transaction insert/read/expiry and five-allowed/sixth-rejected quota checks passed and rolled back. The actual server credential's REST path and browser-to-server-to-Supabase path were also verified.

Shared results expire after 30 days. Raw job descriptions and complete source files are not stored in report rows. Only selected excerpts, extracted requirements, and inspection metadata are retained. Keys are server-only and excluded from source control.

## Provider and scope limits

Google returned intermittent HTTP 503 capacity errors during verification. The application keeps the user's inputs, makes only a bounded temporary-error retry, and does not route to a paid provider. Free operation assumes a free, unbilled Google project; the allowlist cannot prevent charges on a billed project.

Source verification establishes correspondence to inspected code. It does not prove the interpretation, authorship, personal expertise, production readiness, or passing tests. The recorded runs are a small sample. A shared source cache remains deferred.

## Deployment verification

The updated Vercel preview built successfully. Its /example route redirects to the genuine reference report. A new deployed analysis reached Google but returned the handled MODEL_UNAVAILABLE event while the provider reported HTTP 503. Successful new generation on the final production deployment therefore remains a release-verification limit until provider capacity returns. Public browser and stored-report checks are completed against the production release separately.
