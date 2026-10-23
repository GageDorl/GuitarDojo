# syntax=docker/dockerfile:1.7
#
# Two images from one Dockerfile:
#   target "runner"  - the Next.js server (standalone output, non-root, ~200 MB)
#   target "migrate" - one-shot job that applies database migrations, then exits
#
# No secrets are needed at build time; everything is read from the environment at runtime.

FROM node:22-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# ---- dependencies (cached until package*.json changes) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ---- build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- migrations job ----
FROM base AS migrate
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY drizzle ./drizzle
COPY scripts/migrate.mjs ./scripts/migrate.mjs
USER node
CMD ["node", "scripts/migrate.mjs"]

# ---- app server ----
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
