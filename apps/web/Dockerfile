FROM node:20-alpine AS builder
WORKDIR /app
ENV HUSKY=0

RUN corepack enable

# Copy monorepo configurations
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/

# Install required dependencies
RUN pnpm install --frozen-lockfile

# Copy the frontend project code without overwriting workspace install links
COPY apps/web/src apps/web/src
COPY apps/web/public apps/web/public
COPY apps/web/index.html apps/web/index.html
COPY apps/web/postcss.config.js apps/web/postcss.config.js
COPY apps/web/tailwind.config.js apps/web/tailwind.config.js
COPY apps/web/tsconfig.json apps/web/tsconfig.json
COPY apps/web/tsconfig.app.json apps/web/tsconfig.app.json
COPY apps/web/tsconfig.node.json apps/web/tsconfig.node.json
COPY apps/web/vite.config.ts apps/web/vite.config.ts

WORKDIR /app/apps/web

# Build frontend against dynamic endpoints
# Pass VITE_API_URL via Compose/Build arguments
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN pnpm run build

# Serve Stage
FROM nginx:alpine AS runner
# Copy pre-compiled dist outputs to the default NGINX HTML domain
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Expose standard port 80 for web ingress
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
