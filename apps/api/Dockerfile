FROM node:20-alpine AS builder
WORKDIR /app
ENV HUSKY=0
RUN apk add --no-cache openssl

# Enable corepack for pnpm
RUN corepack enable

# Copy monorepo configuration files
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy source code and build inputs without clobbering installed workspace links
COPY apps/api/src apps/api/src
COPY apps/api/prisma apps/api/prisma
COPY apps/api/tsconfig.json apps/api/tsconfig.json

# Generate Prisma client and build typescript
RUN npx prisma generate --schema apps/api/prisma/schema.prisma
RUN node ./node_modules/.pnpm/typescript@*/node_modules/typescript/bin/tsc -p apps/api/tsconfig.json

# Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/apps/api/node_modules /app/apps/api/node_modules

# Copy built code
COPY --from=builder /app/apps/api/dist /app/apps/api/dist
COPY --from=builder /app/apps/api/prisma /app/apps/api/prisma
COPY --from=builder /app/apps/api/package.json /app/apps/api/package.json

# Required Env Vars (to be injected by compose):
# DATABASE_URL, TARGET_DATABASE_URL, OPENAI_API_KEY, AI_PROVIDER=openai

EXPOSE 3001
WORKDIR /app/apps/api
CMD ["sh", "-c", "node /app/node_modules/.pnpm/prisma@*/node_modules/prisma/build/index.js migrate deploy --schema /app/apps/api/prisma/schema.prisma && node dist/index.js"]
