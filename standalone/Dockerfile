FROM node@sha256:47019ffab12a48f49795a8279603f87e91a64de017fb9aa874e64f489b686079 AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
FROM node@sha256:47019ffab12a48f49795a8279603f87e91a64de017fb9aa874e64f489b686079
RUN apk add --no-cache nginx=1.28.3-r7 tini=0.19.0-r3
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY LICENSE ./LICENSE
COPY server/index.cjs ./server/index.cjs
COPY server/data ./server/data
COPY site ./site
COPY runtime ./runtime
USER 10001:10001
EXPOSE 8088
ENTRYPOINT ["/sbin/tini","--","node","/app/runtime/supervise.cjs"]
