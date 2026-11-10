# Verification report

Updated: 10 November 2026

## Automated checks completed

Vitest 5.1.0: 2 test files passed, 29 tests passed.

Covered:

- Repository-root URL validation, unsupported hosts, credentials in URLs, additional paths, and unexpected inputs.
- Job-description length and exact quotation checks.
- Missing file IDs, invalid/fractional/out-of-bounds ranges, trivial quotes, and mismatched source text.
- CRLF normalization and safely encoded source links pinned to a full commit SHA.
- Removal of positive explanations when citations fail.
- Dependency-only references do not become positive implementation evidence.
- Partial cards require valid source references.
- Missing requirements remain visible as not observed.

These tests verify reference correspondence and input boundaries, not the correctness of a model's semantic interpretation.

## Database configuration checked

The exhibits table and expiry index were created in the designated Supabase project.

SQL privilege inspection confirmed:

- Row-level security enabled.
- anon SELECT and INSERT privileges absent.
- authenticated SELECT privilege absent.
- service_role INSERT privilege present.

The Supabase security advisor returned an informational RLS-without-policy notice. This is intentional for a table accessed only by the server's protected credential; browser roles have no table privileges or row-access policies.

## External service probe

A bounded AI Gateway smoke request using the linked project's OIDC credential returned HTTP 403: the Vercel team must add a valid payment method to unlock AI Gateway credits.

No generated answer was received. Model quality, latency, inference cost, and evidence extraction remain unverified.

## Remaining verification

- Real server-to-Supabase insert/read/expiry flow once the server key is configured.
- Complete public GitHub -> model -> verifier -> persisted Exhibit flow.
- Human-reviewed semantic evidence fixtures.
- Public sharing, mobile and keyboard interaction, and browser tests.
- Measured end-to-end time/cost.
- Public deployment and source publication.

No passing result is claimed for the remaining items.
