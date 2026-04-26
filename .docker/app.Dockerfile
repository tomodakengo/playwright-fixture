# Hono demo app — small, fast.
# This is the system-under-test. Tests reach it at http://app:3000 over the
# compose bridge network.

FROM node:20-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM node:20-alpine AS app
WORKDIR /workspace
ENV NODE_ENV=production \
    PORT=3000
RUN apk add --no-cache wget
COPY --from=deps /workspace/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY examples/sample-app ./examples/sample-app
EXPOSE 3000
HEALTHCHECK --interval=2s --timeout=3s --retries=15 --start-period=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["npx", "tsx", "examples/sample-app/index.ts"]
