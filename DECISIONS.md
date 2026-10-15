# Implementation decisions

Updated: 2026-10-15

## 2026-10-15: value and email readiness

- Audited the local landing, age error, chemistry, result, and mobile flow with screenshots in `docs/audit/2026-10-15`. Increased essential text sizes, shortened the mobile landing and the form, and added plain-language result guidance, consultation questions, and a review of normalized inputs. These additions do not classify health status or attribute causality.
- Prepared an optional report-availability email flow using Resend, Supabase, Turnstile and Upstash. It sends email address and consent metadata only. The owner receives an email address and request ID, never biomarker values or a full PDF. This intentionally differs from the attached monetization playbook, which would expose health data through owner email. Full reports and payments remain separate work requiring access controls, consent design, legal review and live-service checks.
- The email flow is off by default behind public/private feature flags and a privacy-notice approval flag. Missing provider secrets, DNS verification, SQL installation, legal identity/notice review and real delivery checks prevent a production-readiness claim. See `docs/EMAIL_SETUP.md`.
- Verification in this branch: local screenshots, TypeScript, lint, seven unit tests, three Chromium E2E tests, and a Next.js production build. Provider delivery, database permissions in a real Supabase project, Vercel Cron and real-world user value have not been verified.

- Explicitly set the Vercel framework to Next.js in `vercel.json` after a production project returned `404 NOT_FOUND` even though the local production build served `/`. This is a deployment configuration change; Vercel project settings and the active production commit still require inspection in the Vercel dashboard. No local application behavior is changed.

- Implemented the supplied Clinical PhenoAge model in TypeScript and kept the source reference, model assets, and original Stage 3 package in the repository. Golden test vectors cover all 18 successful and 10 invalid cases.
- Kept calculation in browser memory and made the UI independent of a backend. The standalone API route returns only preview outputs and does not persist input. This reduces health-data exposure while report delivery infrastructure is not configured.
- Report/email delivery, Supabase persistence, application-level encryption, lead tokens, Turnstile, rate limiting, private PDF delivery, admin/MFA, Stripe, and production legal review remain disabled or incomplete. No service credentials were supplied; no fake service integrations or purchases were enabled.
- The requested shadcn CLI could not be reached from the setup environment. The app uses small local accessible button and input primitives with the same project styling, without adding an unverified generated dependency.
- Google Drive sync is an optional maintainer command. It checks manifest hashes before uploading static assets to a configured folder; it does not read health data. Its OAuth/API network destinations are included in the cloud setup draft.
- The example environment file contains blank optional Drive settings. The browser app does not need environment variables to run.
- The package's reference materials describe assumptions and limitations, not clinical validation. The implementation does not claim that the model is clinically validated for individual decisions; external review of source evidence and all legal copy is still needed before public launch.

## Verification

See the command results recorded in the handoff. Setup checks include TypeScript, lint, golden vectors, browser flow, manifest checksums, and a production build. Production deployment, staging restoration, accessibility audit, and Lighthouse performance targets have not been exercised here.
