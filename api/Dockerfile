# ⚠️  هذا الـ Dockerfile مخصص للبيئة المحلية أو عند تشغيل api/ بشكل منفرد.
#
# للـ PRODUCTION على DigitalOcean App Platform، استخدم الـ Dockerfile
# الموجود في جذر المشروع:
#   Dockerfile Path: Dockerfile         (في الجذر)
#   Build Context:   /                  (الجذر — مهم!)
#
# الـ Dockerfile في الجذر يبني admin/ و api/ معاً في image واحدة.
# ─────────────────────────────────────────────────────────────

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY .npmrc* ./

RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Production (API only — no admin static files)
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
COPY .npmrc* ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["sh", "-c", "npx prisma db push && node dist/main"]
