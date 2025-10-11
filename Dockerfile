# ---------- 1. 基础镜像 ----------
    FROM node:20-alpine AS base
    WORKDIR /app
    
    # ---------- 2. 依赖安装阶段 ----------
    FROM base AS deps
    # 安装兼容库
    RUN apk add --no-cache libc6-compat
    
    # 设置国内镜像源，解决 npm 下载慢的问题
    RUN npm config set registry https://registry.npmmirror.com \
        && pnpm config set registry https://registry.npmmirror.com
    
    # 启用 pnpm 并安装依赖
    COPY package.json pnpm-lock.yaml* ./
    RUN corepack enable pnpm && pnpm install --frozen-lockfile
    
    # ---------- 3. 构建阶段 ----------
    FROM base AS builder
    WORKDIR /app
    
    # 复制依赖和源代码
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    
    # 使用构建参数
    ARG APP_URL=http://localhost.json4u.cn:3000
    ARG FREE_QUOTA=99
    
    # 注意：SENTRY_AUTH_TOKEN 不建议通过 ENV 或 ARG 直接暴露
    # 构建阶段用 ARG 仅作编译占位，实际运行时应通过 docker run -e 注入
    ARG SENTRY_AUTH_TOKEN=""
    ENV NEXT_TELEMETRY_DISABLED=1
    ENV NODE_ENV=production
    ENV NEXT_PUBLIC_APP_URL=$APP_URL
    ENV NEXT_PUBLIC_FREE_QUOTA="{\"graphModeView\":$FREE_QUOTA,\"tableModeView\":$FREE_QUOTA,\"textComparison\":$FREE_QUOTA,\"jqExecutions\":$FREE_QUOTA}"
    
    RUN corepack enable pnpm && pnpm run build
    
    # ---------- 4. 运行阶段 ----------
    FROM base AS runner
    WORKDIR /app
    
    # 创建运行用户
    RUN addgroup --system --gid 1001 nodejs \
     && adduser --system --uid 1001 nextjs
    
    # 复制构建产物
    COPY --from=builder /app/public ./public
    COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
    COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
    
    # 设置缓存目录权限
    RUN mkdir .next && chown nextjs:nodejs .next
    
    USER nextjs
    
    EXPOSE 3000
    ENV PORT=3000
    ENV HOSTNAME="0.0.0.0"
    
    # 注意：运行时才注入 SENTRY_AUTH_TOKEN
    # docker run -e SENTRY_AUTH_TOKEN=xxx your_image
    CMD ["node", "server.js"]
    