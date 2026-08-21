# ─────────────────────────────────────────────────────────────
# Stage 1: Build the Admin React/Vite frontend
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS admin-builder

WORKDIR /admin

COPY admin/package*.json ./
RUN npm ci

COPY admin/ ./
RUN npm run build
# Output: /admin/dist/

# ─────────────────────────────────────────────────────────────
# Stage 2: Build the NestJS API
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS api-builder

WORKDIR /api

COPY api/package*.json ./
COPY api/.npmrc* ./

# Install ALL deps (including devDependencies needed for tsc / nest build)
RUN npm ci

# Generate Prisma client before building
COPY api/prisma ./prisma
RUN npx prisma generate

# Copy source and build
COPY api/ ./
RUN npm run build
# Output: /api/dist/

# ─────────────────────────────────────────────────────────────
# Stage 3: Production image
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Install production-only API dependencies
COPY api/package*.json ./
COPY api/.npmrc* ./
RUN npm ci --omit=dev

# Prisma schema + generate client for production runtime
COPY api/prisma ./prisma
RUN npx prisma generate

# NestJS compiled output
COPY --from=api-builder /api/dist ./dist

# Admin built static files — placed at /app/../admin/dist
# so that main.ts's `join(process.cwd(), '..', 'admin', 'dist')` resolves correctly.
# process.cwd() == /app  →  ../admin/dist == /admin/dist
COPY --from=admin-builder /admin/dist /admin/dist

EXPOSE 8080

# On startup: sync DB schema then start the server.
# Using `db push --accept-data-loss` is safe here because this project
# has no Prisma migrations history. Switch to `migrate deploy` once you
# create your first baseline migration.
CMD ["sh", "-c", "npx prisma db push && node dist/main"]
