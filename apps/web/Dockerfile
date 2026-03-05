FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable

# Copy monorepo configurations
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/

# Install required dependencies
RUN pnpm install --frozen-lockfile

# Copy the frontend project code
COPY apps/web apps/web

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
