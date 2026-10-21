# Loan Simulator (Capitec-inspired)

A front-end-only loan simulator with two separate flows:

1. **Affordability** (animated, step by step): loan type → income → expenses → amount and term → result (instalment, total cost, fees, affordability verdict).
2. **Eligibility** (step by step, at the end): basic requirements → one upload step per required document (simulated) → review and submit.

There is no backend. Progress, answers and uploaded-file *metadata* are saved to `localStorage`, so a refresh keeps your place. Uploads are simulated, the files themselves are never read or stored.

Covers: personal, vehicle, home, education, home improvement and medical loans, and credit for multiple income earners. Requirements and documents per loan are data in `src/lib/loans.ts`.

> Independent demo inspired by Capitec Bank's look and feel. Not affiliated with or endorsed by Capitec. Results are indicative only.

## Stack

React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix primitives in `src/components/ui`), zod, i18next (English), Motion, Sonner (toasts), Jest, Playwright.

React Bits and Magic UI are copy-paste libraries, so their patterns live in `src/components/effects`: `CountUp` and `BlurText` (React Bits style) and `ShimmerButton` (Magic UI style). To use the originals, install them with their CLI from reactbits.dev / magicui.design and swap the imports.

## Requirements

Node 18.18+ (Node 20 recommended, see `.nvmrc`) and npm.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
```

## Build

```bash
npm run build        # type-checks, then builds to dist/
npm run preview      # serves dist/ at http://localhost:4173
```

## Test

Unit tests (Jest, pure logic: calculations, validation schemas, storage, upload simulation):

```bash
npm test
```

End-to-end tests (Playwright on Chrome, Firefox, Safari/WebKit, Android Pixel 7, iOS iPhone 14 emulation):

```bash
npm run e2e:install  # one-time: downloads browsers
npm run e2e          # builds, serves a preview, runs all projects
npx playwright test --project=chromium     # a single browser
npx playwright show-report                 # open the HTML report
```

Mobile projects are emulation. Testing on real devices needs a device cloud.

## Project layout

```
src/
  lib/          loans.ts (config), calc.ts (affordability maths), schemas.ts (zod),
                state.ts + storage.ts (persisted state), upload.ts (simulated uploads), flow.ts
  state/        SimulatorContext (state + localStorage sync)
  components/   ui/ (shadcn), effects/ (React Bits / Magic UI style), steps/, Seo, Layout, StepShell
  pages/        Landing, Simulator, NotFound
  i18n/         en.ts (all copy)
e2e/            Playwright specs
```

## Where to tune things

| What | Where |
| --- | --- |
| Brand colours (HSL CSS variables) and radius | `src/index.css` |
| Typography (Figtree, loaded from Google Fonts) | `index.html`, `tailwind.config.ts` |
| Loan limits, terms, indicative rates, age bands, requirements, documents | `src/lib/loans.ts` |
| Fees and the "affordable" threshold (70% of disposable income) | top of `src/lib/calc.ts` |
| All copy | `src/i18n/en.ts` (add `xx.ts` and register it in `src/i18n/index.ts` for new languages) |

Brand values are close approximations of Capitec's blue and red, and the font is a stand-in. Drop in the official logo, fonts and exact colours if you have the brand assets.

## SEO

Per-route title, description, canonical, Open Graph and Twitter tags (`src/components/Seo.tsx`), JSON-LD (`WebApplication` and `FAQPage`) on the landing page, `noindex` on the 404 page, `robots.txt`, `sitemap.xml`, web manifest, favicon and a social image. Set your real domain in `VITE_SITE_URL` (for example in `.env.production`) and update the URLs in `public/robots.txt` and `public/sitemap.xml`. Because this is a client-rendered SPA, consider pre-rendering for best crawler results.

## Demo tips

- Upload a file with `__fail` in its name (for example `payslip__fail.pdf`) to see the upload error toast.
- Only PDF, JPG and PNG up to 5 MB are accepted.
- Home loans ask your marital status (adds a marriage certificate step) and add an assets and liabilities step above R2.5 million.
