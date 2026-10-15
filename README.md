# AgeClarity

AgeClarity is a multilingual, responsive Clinical PhenoAge preview built with Next.js. The browser validates and calculates the preview locally. The result is not a diagnosis or an estimate of lifespan.

## Run locally

Requirements: Node.js 20.9 or newer and npm 10 or newer.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The app supports Spanish (`/es`), English (`/en`), and Portuguese (`/pt`).

## Deploy on Vercel

Import this repository with **Framework Preset: Next.js**, **Root Directory: `./`**, and the default build and output settings. The repository also declares the Next.js framework in `vercel.json`. The production deployment must use the latest commit on `main`. The root URL (`/`) serves the Spanish app directly; `/es`, `/en`, and `/pt` are also available.

If Vercel reports `404 NOT_FOUND` for `/`, check the production deployment's source commit and these project settings before redeploying. A deployment marked Ready only confirms the build completed; it does not establish that Vercel selected the Next.js framework or the intended project root.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run drive:verify
npm run build
```

Playwright uses its bundled Chromium by default and uses a system Chromium when one is available. To install the browser locally, run `npx playwright install chromium`.

## Privacy and integrations

The calculator keeps form values in page memory. The UI does not submit health data, store it in a database or browser storage, or send it to analytics. Reloading or resetting clears the values. `/api/v1/calculate` is a stateless preview endpoint and is not called by the UI; it does not persist inputs. An optional, disabled-by-default [email interest flow](docs/EMAIL_SETUP.md) can confirm requests for future reports without sending biomarkers. PDF report delivery, accounts, payments, and admin tools are not enabled.

The optional `npm run drive:sync` command uploads only the static files listed in `spec/drive_manifest.json` after verifying their SHA-256 checksums. It requires `GOOGLE_SERVICE_ACCOUNT_JSON_BASE64` and `GOOGLE_DRIVE_FOLDER_ID`; the folder must be shared with the service account. The script uses the Google Drive API's `drive` scope and never prints the credential or access token. Keep credentials out of the repository and terminal history. `npm run drive:verify` needs no credentials or network.

## Project references

The product brief, model assumptions, acceptance criteria, and implementation decisions are in `docs/`, `spec/`, `TASKS.md`, and `DECISIONS.md`. `original_stage3/` preserves the supplied package unchanged.
