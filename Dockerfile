# ainie-knowfind runtime image.
#
# One image serves both halves: `vite build` produces dist/, and server.ts
# (run through tsx, since the sources stay TypeScript) serves dist/ plus the
# /api/* and /health routes. NODE_ENV is set at RUN time, not build time --
# with it set during `npm install` the dev dependencies vite and tsx would be
# skipped and neither the build nor the server could run.
FROM node:22-alpine

WORKDIR /app

# Dependencies first, so a source-only change does not reinstall them.
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Reported by /health and published to smartplanet/telemetry/knowfind.
CMD ["npx", "tsx", "server.ts"]
