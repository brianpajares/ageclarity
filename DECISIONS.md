# Implementation decisions

Updated: 2026-10-13

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
