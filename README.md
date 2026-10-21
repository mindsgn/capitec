# Capitec Loan Simulator

Independent demo of a loan affordability and eligibility flow. Estimate a monthly instalment, see whether it fits a budget, then walk through the documents an application needs.

Answers stay in the browser. Uploaded documents stay on the device. Lending rules come from a simulated API served with the app. This project is not affiliated with or endorsed by Capitec Bank. Results are indicative and are not an offer of credit.

## Prerequisites

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) 20 or newer. `.nvmrc` pins 20. Node 18.18 is the oldest version the app accepts. Docker images and CI use Node 24.
- Yarn 1.22.22, enabled through Corepack (included with Node):

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
```

Docker is optional. Use it when you want to run the app without installing Node.

## Clone

```bash
git clone https://github.com/mindsgn/capitec.git
cd capitec
```

SSH works the same way: `git clone git@github.com:mindsgn/capitec.git`.

## Run locally

```bash
cd frontend
cp .env.example .env
yarn install --frozen-lockfile
yarn dev
```

Open [http://localhost:5173](http://localhost:5173).

| Path | Page |
| --- | --- |
| `/` | Landing page |
| `/simulator` | Affordability and eligibility flow |

The dev server also serves the mock loan API under `/api/loans`.

`VITE_SITE_URL` in `frontend/.env` is the public origin used in page metadata. The default in `.env.example` is fine for local use. Vite reads it when the app starts or when you build.

## Production build

From `frontend/`:

```bash
yarn build
yarn start
```

Open [http://localhost:3000](http://localhost:3000).

`yarn build` typechecks the app, builds the static files, and bundles the production server. `yarn start` serves those files and the same mock API. Set `PORT` if 3000 is taken, for example `PORT=8080 yarn start`.

Set `VITE_SITE_URL` in `frontend/.env` before `yarn build`. Vite writes that value into the built files, so changing it after the build has no effect until you build again.

## Docker

Development, with source in `frontend/src` synced into the container:

```bash
docker compose up --build dev
```

Open [http://localhost:5173](http://localhost:5173).

Production image:

```bash
docker compose up --build prod
```

Open [http://localhost:3000](http://localhost:3000). A healthy container answers `GET /api/loans/products`.

The same production image without Compose:

```bash
docker build --build-arg VITE_SITE_URL=http://localhost:3000 -t loan-simulator .
docker run --rm -p 3000:3000 loan-simulator
```

Replace `VITE_SITE_URL` with the public origin when you build an image for a real host.

## Tests

From `frontend/`:

```bash
yarn typecheck
yarn test
```

End-to-end tests use Playwright against the production server on port 4173. Install the browsers once, then run the suite:

```bash
yarn e2e:install
yarn e2e
```

`yarn e2e --project=chromium` runs Chromium only. `yarn e2e:ui` opens the Playwright UI.

## Layout

| Path | Role |
| --- | --- |
| `frontend/` | React app (Vite, TypeScript, Yarn) |
| `frontend/server/index.ts` | Production server for the built app and `/api/loans` |
| `frontend/src/mocks/loansApi.ts` | Simulated lending API |
| `Dockerfile` | Production image |
| `Dockerfile.dev` | Development image |
| `compose.yml` | `dev` and `prod` services |
