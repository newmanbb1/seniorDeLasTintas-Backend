FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tzdata

RUN mkdir -p /app/uploads && \
    addgroup -S appgroup && \
    adduser -S appuser -G appgroup

COPY --chown=appuser:appgroup --from=build /app/dist ./dist
COPY --chown=appuser:appgroup --from=build /app/node_modules ./node_modules
COPY --chown=appuser:appgroup --from=build /app/package.json ./

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/branch/public || exit 1

CMD ["node", "dist/main.js"]
