# Build the Vite app and the production server, then run that server.
# VITE_SITE_URL is inlined by Vite. A runtime environment variable does not change it.

ARG NODE_VERSION=24.14.0-alpine
FROM node:${NODE_VERSION} AS build

WORKDIR /app
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare yarn@1.22.22 --activate

COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile

COPY frontend/ .
ARG VITE_SITE_URL=https://loan-simulator.example.com
ENV VITE_SITE_URL=${VITE_SITE_URL}
RUN yarn build

FROM node:${NODE_VERSION} AS run

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/dist ./dist
COPY --from=build /app/server-dist/index.js ./server.js

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/loans/products').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "server.js"]
