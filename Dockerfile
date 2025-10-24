# build stage
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 配置代理环境变量（让 Docker build 内部能访问宿主机代理）
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG ALL_PROXY
ENV http_proxy=$HTTP_PROXY
ENV https_proxy=$HTTPS_PROXY
ENV all_proxy=$ALL_PROXY

# 配置国内镜像源加速
RUN corepack enable pnpm
RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm config set electron_mirror https://npmmirror.com/mirrors/electron/
RUN pnpm config set sass_binary_site https://npmmirror.com/mirrors/node-sass/

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# 继承代理环境变量
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG ALL_PROXY
ENV http_proxy=$HTTP_PROXY
ENV https_proxy=$HTTPS_PROXY
ENV all_proxy=$ALL_PROXY

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 配置构建时的国内镜像源
RUN corepack enable pnpm
RUN pnpm config set registry https://registry.npmmirror.com

ARG APP_URL=http://localhost.json4u.cn:3000
ARG FREE_QUOTA=99
ARG SENTRY_AUTH_TOKEN=

ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=$APP_URL
ENV NEXT_PUBLIC_FREE_QUOTA="{\"graphModeView\":$FREE_QUOTA,\"tableModeView\":$FREE_QUOTA,\"textComparison\":$FREE_QUOTA,\"jqExecutions\":$FREE_QUOTA}"

RUN pnpm run build

# Production image
FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

