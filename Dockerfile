FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache tzdata

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY uploads/ ./uploads/

EXPOSE 3000

CMD ["node", "dist/main.js"]
