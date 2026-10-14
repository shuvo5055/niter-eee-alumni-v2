# NITER EEE Alumni Association — Production Readiness Audit

**Audit date:** 2026-10-14  
**Audited deployment:** https://nitalumni-bpznsmzc.manus.space/  
**Project:** `niter-eee-alumni-v2`  
**Scope:** Read-only inspection and non-destructive functional/security checks. No credentials, permissions, schema, records, or production code were changed during this audit.

## Executive assessment

**Current status: Not ready for unrestricted real-user launch.**

The public site is operational and the core directory/search flow is functioning against the real database. The project has a real backend, database-backed public records, server-side admin/editor guards, persistent managed storage, and good baseline session-cookie protections.

However, one **critical account-takeover condition** is verified:

> The public individual-profile API returns a populated alumni email address, while the public alumni sign-in accepts that same registered email as the initial password for accounts that have not yet configured a password.

This makes any unclaimed account vulnerable to takeover by anyone who can read the public profile response. This must be fixed before real users are invited to claim profiles.

The site also has a serious dependency backlog, missing defense-in-depth HTTP headers, no demonstrated 500-user capacity test, no verified backup/restore evidence in the accessible project, and unpaginated directory/admin queries that will become a scaling bottleneck.

## Verified technology and data source

- **Frontend:** React 19, TypeScript, Vite 7, Tailwind CSS 4, Wouter.
- **Backend:** Express 4, tRPC 11, Drizzle ORM.
- **Database:** MySQL/TiDB through `DATABASE_URL`; schema is defined in `drizzle/schema.ts`.
- **Storage:** Managed Forge/S3-style storage through `server/storage.ts` and `server/_core/storageProxy.ts`.
- **Authentication:** Separate administrator/user session and alumni-owner session flows.
- **Deployment:** Published domain above; project health showed the dev server running and TypeScript/LSP without reported errors. The accessible project status did not expose hosting-plan limits, CPU/memory metrics, database connection limits, quotas, or concurrency limits.

## Functional testing

### Routes and refresh behavior

Non-destructive HTTP checks returned **200** for:

- `/`
- `/alumni`
- `/batches`
- `/districts`
- `/jobs`
- `/gallery`
- `/about`
- `/contact`
- `/alumni/erik-hasan-submission-1`

This confirms the SPA shell and direct-refresh fallback are available for those routes. A full authenticated browser walkthrough was intentionally not performed because the audit scope prohibited browser login/live-site takeover.

### Directory and search

The deployed public API was checked against real database results:

| Check | Result |
|---|---:|
| Published records returned for empty search | 69 |
| Search `Batch 12` | 19 records |
| Search `Batch 99` | 0 records |
| Search `Erik Hasan` | 1 record |
| Exact batch normalization (`12`, `Batch 12`, `batch-12`) | Implemented in `shared/alumniSearch.ts` / `server/routers.ts` |
| No-results state | Implemented in `client/src/pages/Alumni.tsx` |
| API-error state | Implemented in `client/src/pages/Alumni.tsx` |
| Clear-search state/action | Implemented in `client/src/pages/Alumni.tsx` |

The earlier automated project verification recorded **23 test files / 57 tests passed** and a successful production build after the directory-search handoff repair.

**Limitation:** There is no pagination in the public `publicData.alumniList` query or the admin alumni list query. The current 69-row dataset is small, but returning the entire dataset on every search/filter request is not a safe long-term design for a growing alumni directory.

### Database integrity snapshot

A read-only database audit found:

- Total alumni: **69**
- Published alumni: **69**
- Draft alumni: **0**
- Records missing a batch: **0**
- Records with a blank name: **0**
- Duplicate non-empty email values: **0**
- Duplicate slugs: **0**
- Public bulk API records: **69**

No records were deleted, updated, migrated, or bulk-modified.

### Public response fields

The public bulk response excludes `email`, `phone`, `address`, `passwordHash`, and `claimed`; this is a positive privacy control.

The public bulk response does include profile and professional fields such as student ID, blood group, education, organization, designation, city, industry, and social links. These fields should be treated as intentionally public only after the owner confirms that this visibility is acceptable.

The public individual-profile API was tested and **does include an `email` key with a non-empty value** for the tested public profile. This is the evidence used for the critical finding below.

## Security findings

### Critical — public email plus email-as-initial-password enables profile takeover

**Evidence**

- `server/routers.ts:160-175`: public `alumniClaim.signIn` authenticates by registered email and password.
- `server/alumniCredentials.ts:15-18, 47-58`: missing passwords are initialized to the normalized registered email, hashed with the existing method.
- `server/routers.ts:222-225`: public `publicData.alumniBySlug` returns `publicProfileAlumniSelect`, which includes email; deployed API verification confirmed the email is present and non-empty.
- `drizzle/schema.ts:42,67-78`: email and password hash are stored on the alumni record; email has a unique index.

**Impact**

An attacker can enumerate public profiles, obtain a registered email, and attempt the documented initial password rule. If the account is still unclaimed and has not configured a custom password, the attacker can create the alumni session and submit profile changes under that identity. This is an account-takeover and privacy-impact issue.

**Required fix**

Choose one secure design before launch:

1. Do not expose email in any public profile response; or
2. Do not use the email address as a login password; issue a one-time private onboarding secret through an approved channel; or
3. Require administrator-confirmed claim activation before sign-in is possible.

The safest minimal change consistent with the existing UI is to remove email from `publicProfileAlumniSelect` and all public profile responses, then keep email available only to the owner session and authorized administrators. This alone does not solve the weak initial-password design, so the initial-password rule must also be replaced or disabled before invitations are sent.

**Affected files:** `server/routers.ts`, `server/alumniCredentials.ts`, `server/alumniClaim.ts`, `client/src/pages/Profile.tsx`, `drizzle/schema.ts` if the credential model changes.

### High — dependency vulnerabilities require remediation

`pnpm audit --prod --json` reported:

- **1 critical**
- **20 high**
- **52 moderate**
- **10 low**
- **83 advisories total**

Notable affected packages/advisories include:

- `proxy-addr` critical advisory; recommended upgrade to `2.0.8+`.
- `xlsx` high advisories including ReDoS and prototype-pollution issues; no automatic fix was reported.
- `drizzle-orm` high advisory; upgrade recommendation `0.45.2+`.
- `axios` high advisories; upgrade recommendations include `1.16.0+` / newer depending on advisory.
- `path-to-regexp`, `nanoid`, `lodash`, `form-data`, `dompurify`, and `katex` advisories are also present through direct or transitive dependencies.

**Impact**

The exact exploitability depends on reachable code paths and whether vulnerable packages are server-side, build-time, or browser-side. The critical `proxy-addr` finding must be triaged first. `xlsx` deserves special review because administrator Excel import processes attacker-controlled workbook content.

**Affected files:** `package.json`, `pnpm-lock.yaml`, import code under `server/alumniImport.ts`, and any package usage identified during upgrade testing.

### High — no demonstrated capacity for 500 simultaneous users

No 50/100/250/500-user load test was run. The audit requirements prohibit disruptive production traffic and no staging target, hosting permission, or stop-condition configuration was supplied.

**Impact**

It is not valid to claim support for 500 concurrent users. The current implementation performs whole-list queries and multiple aggregate queries without pagination or documented connection-pool/concurrency limits. The current 69-record dataset does not establish future capacity.

**Required fix**

Run a controlled ramp test against staging or an explicitly approved production test window, with 50 → 100 → 250 → 500 virtual users, realistic browse/search/profile traffic, and measurements for throughput, p50/p95, error/timeout rate, DB latency, connection utilization, CPU, memory, and rate-limit behavior.

### Medium — missing defense-in-depth security headers

The deployed homepage headers included HTTPS/HSTS and `X-Content-Type-Options: nosniff`, but did not show `Content-Security-Policy`, `X-Frame-Options` or `frame-ancestors`, `Referrer-Policy`, or `Permissions-Policy`. The response also exposed `X-Powered-By: Express`.

**Impact**

Clickjacking, referrer leakage, browser-feature abuse, and reduced incident-observability protections are weaker than recommended. This is defense-in-depth, not evidence of a currently exploitable XSS.

**Recommended fix**

Add a carefully tested header middleware in the server bootstrap, preferably with a restrictive CSP compatible with the current managed assets and OAuth flow; disable `X-Powered-By`.

**Affected file:** `server/_core/index.ts`.

### Medium — `SameSite=None` sessions without an explicit application CSRF strategy

`server/_core/cookies.ts:42-47` sets `httpOnly: true`, `secure` on HTTPS, `path: /`, and `sameSite: "none"` for both session families. The `httpOnly` and secure settings are positive. However, the audit did not find an explicit CSRF token/origin-check middleware for state-changing tRPC mutations.

**Impact**

Because `SameSite=None` permits cross-site cookie attachment, browser-based cross-site request forgery should be treated as a risk until every mutation is protected by an origin check, CSRF token, or a deliberately proven same-site architecture.

**Recommended fix**

Add server-side Origin/Referer validation for mutation requests and/or a synchronizer/double-submit CSRF token. Preserve OAuth state protection separately; OAuth state does not replace mutation CSRF protection.

**Affected files:** `server/_core/cookies.ts`, `server/_core/index.ts`, tRPC request handling.

### Medium — public reads and profile pages are scrapeable without throttling

The public directory and profile endpoints are intentionally unauthenticated, and the audit found no global read-rate limiter. Batch-code-gated submission has dedicated failure throttling, and alumni sign-in has per-record lockout behavior, which are positive controls. Public search/profile reads remain freely automatable.

**Impact**

Bulk scraping, resource exhaustion, and enumeration of public professional records are possible. This is especially important because the profile endpoint currently returns email.

**Recommended fix**

Remove email from public responses first; then add edge/server rate limiting, bounded query lengths, pagination, and response caching where appropriate. Do not rely on client-side controls.

### Medium — image upload validation is incomplete in the alumni-owner path

`server/routers.ts:193-206` checks MIME type and base64 length before storage, but does not verify decoded file signatures/dimensions and accepts a user-supplied filename. `server/storage.ts` adds a random suffix, which reduces collisions, but key normalization only strips leading slashes.

**Impact**

Malformed or mislabeled image content can be uploaded and stored. The current storage proxy returns the object through a signed redirect; content-type and browser behavior should be constrained.

**Recommended fix**

Decode and verify magic bytes, enforce dimensions and pixel count, sanitize the filename to a generated safe extension, reject SVG/animated formats unless explicitly required, and store an immutable generated key. Add tests for malformed content and oversized dimensions.

### Low — backup/restore evidence is not available in the project audit surface

The accessible project files show `activityLogs`, but no documented backup schedule, retention policy, restore runbook, or completed restore test. No backup action was taken because the audit forbids unapproved writes or external system access.

**Impact**

Recoverability after an accidental deletion, provider outage, or corruption is unverified.

**Recommended fix**

Document database and managed-storage backups, retention, encryption, RPO/RTO, and run a restoration drill in an isolated environment.

### Informational — positive controls verified

- Admin/editor routes use server-side `adminProcedure` / `editorProcedure` checks in `server/_core/trpc.ts`.
- Alumni-owner edits use `alumniProcedure` and bind to the signed alumni session ID.
- Batch submissions use server-side access grants and pending review records.
- Cookies are `httpOnly`; HTTPS cookies are `secure`.
- Public bulk responses do not include email, phone, address, password hash, or claimed state.
- React rendering was used for application content; no application-level `dangerouslySetInnerHTML` sink was found. The only match was the shadcn chart style injection component, not user-provided content.
- A source/build scan found no direct client exposure of `DATABASE_URL`, `JWT_SECRET`, `BUILT_IN_FORGE_API_KEY`, or comparable server credentials.
- Schema indexes exist for alumni slug, student ID, email, batch, district, and status; batch and district names are unique.
- Audit activity records are written for many administrator and owner-review actions.

## Performance and 500-user capacity

### Tests actually completed

- Read-only route checks: all tested routes returned HTTP 200.
- Public API response checks: Batch 12 returned 19 records, Batch 99 returned 0, and a full-name search returned 1.
- Database integrity read: 69/69 records published, no duplicate email or slug values, no missing batch or blank name in the snapshot.
- **No load test** was run against production.

### Why a 500-user claim cannot be made

The accessible hosting status showed the project and dev server status but not:

- hosting plan or CPU/memory allocation;
- database connection-pool size or max connections;
- provider request quotas or concurrency limits;
- CDN/cache behavior for API responses;
- rate-limit thresholds;
- production CPU, memory, event-loop, or database telemetry.

Therefore the 500-user requirement is **unknown**, not passed or failed by measurement.

### Likely bottlenecks from code inspection

1. Public alumni list returns all matching rows without page size/cursor.
2. Admin alumni list also returns all rows without pagination.
3. Public search performs joined `LIKE '%term%'` matching across several text fields; ordinary indexes will not help leading-wildcard queries.
4. Admin overview performs multiple aggregate queries in parallel; acceptable at current size but should be measured under concurrency.
5. Storage proxy uses a signed redirect per image request and disables caching at the proxy layer; large directory pages may create many storage requests.
6. No application-wide public read rate limit was identified.

## Prioritized remediation plan

### P0 — before real-user launch

1. Remove `email` from `publicProfileAlumniSelect` and all public profile API responses.
2. Replace email-as-initial-password with a secure onboarding/claim mechanism that does not disclose or derive a secret from public data.
3. Invalidate any exposed initial credentials if the current deployment has already been used by real alumni.
4. Add regression tests proving that a public profile response contains no email and that an attacker cannot claim an account using publicly discoverable fields.

### P1 — before broad launch

1. Patch/upgrade the critical and high-severity dependency chain, starting with `proxy-addr`, `drizzle-orm`, `xlsx`, `axios`, and `path-to-regexp`; run the full test/build/import regression suite after each compatibility group.
2. Add CSRF/origin protection for all state-changing mutations, including admin and alumni-owner flows.
3. Add security headers and remove `X-Powered-By`.
4. Add public API pagination, maximum page size, bounded search input, and server-side rate limiting.
5. Complete a controlled capacity test in staging or an explicitly approved production window.

### P2 — reliability and data protection

1. Harden image upload validation and generated storage keys.
2. Confirm and document database/storage backup retention and complete a restore drill.
3. Add production metrics and alerts for p95 latency, 5xx rate, database connections, memory, CPU, storage errors, and rate-limit events.
4. Add automated tests for public-field projections, query pagination, abuse limits, and profile privacy.

### P3 — maintainability

1. Add explicit database foreign-key constraints or documented referential-integrity handling for batch/district/alumni relations.
2. Add search-specific indexes/full-text strategy if the directory grows materially.
3. Add a privacy review for student ID, blood group, city, education, work history, and social links.
4. Add a documented release checklist covering migration safety, rollback, storage assets, and post-deploy smoke tests.

## Exact project files likely requiring modification

- `server/routers.ts` — public projections, claim/sign-in flow, pagination/rate limits, upload validation, mutation origin checks.
- `server/alumniCredentials.ts` — remove or replace email-derived initial passwords.
- `server/alumniClaim.ts` — secure onboarding/claim policy and credential tests.
- `server/_core/cookies.ts` — cookie policy after CSRF/origin design is selected.
- `server/_core/index.ts` — security headers, request limits, and possibly rate limiting.
- `server/_core/trpc.ts` — shared mutation protection if implemented at the tRPC layer.
- `server/storage.ts` and `server/_core/storageProxy.ts` — safe upload keys, content validation, and cache/content headers.
- `drizzle/schema.ts` — only if the secure claim model or pagination/index strategy requires schema changes; no migration was performed in this audit.
- `client/src/pages/Profile.tsx` — adjust UI if public email is removed or onboarding changes.
- `client/src/components/AlumniClaimPanel.tsx` — secure claim/sign-in UX after the P0 design is approved.
- `client/src/pages/Alumni.tsx` and `client/src/components/DirectoryControls.tsx` — pagination and bounded query UX.
- `package.json` and `pnpm-lock.yaml` — dependency remediation.
- relevant `server/*.test.ts` and `client/src/*test.ts` — regression coverage.

## Safe post-fix regression plan

1. Run `pnpm test`, `pnpm exec tsc --noEmit`, and `pnpm build`.
2. Verify all public profile and directory responses contain only approved fields; explicitly assert email/phone/address/password hash are absent.
3. Verify an unclaimed profile cannot be claimed with a public field or public profile data.
4. Verify a legitimate owner can sign in through the new approved onboarding flow and can edit only their own pending record.
5. Verify admin/editor authorization for every create/update/delete/review procedure, including cross-user and cross-alumni attempts.
6. Verify CSRF/origin checks reject cross-origin state-changing requests and allow the expected same-origin/OAuth flows.
7. Verify malformed, oversized, mislabeled, and SVG uploads are rejected; valid image uploads persist and remain isolated per alumni.
8. Verify pagination, search normalization, empty states, and database errors at 0, 69, 500, and larger synthetic staging datasets.
9. Run staged load tests at 50, 100, 250, and 500 concurrent users with explicit stop conditions and record throughput, p50/p95 latency, error rate, timeouts, DB connections, CPU, memory, and rate limits.
10. Perform a restore drill for database and managed storage, then document RPO/RTO and rollback steps.

## Final conclusion

The site has a functioning, database-backed public directory and a credible application structure, but it is **not demonstrably secure or capacity-ready for a 500-user real-user launch**. The public-email/initial-password combination is a verified critical issue and should be treated as a release blocker. Dependency remediation, CSRF protection, security headers, pagination/rate limiting, backup evidence, and controlled load testing are the next required gates.
