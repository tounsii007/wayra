# --- Stage 1: deps ---
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/types/package.json ./packages/types/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# --- Stage 2: build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app /app
COPY . .
RUN pnpm --filter @wayra/backend build

# --- Stage 3: runtime ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/package.json ./
COPY --from=build /app/node_modules ./node_modules
EXPOSE 4000
CMD ["node", "dist/main.js"]
