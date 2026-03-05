FROM node:20-alpine AS builder
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Install global turbo
RUN pnpm install -g turbo

# Copy monorepo configuration files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy source code and prisma schema
COPY apps/api apps/api

WORKDIR /app/apps/api

# Generate Prisma client and build typescript
RUN pnpm exec prisma generate
RUN pnpm run build

# Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/

RUN pnpm install --prod --frozen-lockfile

# Copy generated Prisma client from builder
COPY --from=builder /app/node_modules/.pnpm /app/node_modules/.pnpm
COPY --from=builder /app/node_modules/@prisma /app/node_modules/@prisma

# Copy built code
COPY --from=builder /app/apps/api/dist /app/apps/api/dist
COPY --from=builder /app/apps/api/prisma /app/apps/api/prisma

WORKDIR /app/apps/api

# Required Env Vars (to be injected by compose):
# DATABASE_URL, TARGET_DATABASE_URL, OPENAI_API_KEY, AI_PROVIDER=openai

EXPOSE 3001
CMD ["pnpm", "run", "start"]
