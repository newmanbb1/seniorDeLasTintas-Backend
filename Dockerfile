FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY dist/ ./dist/
COPY node_modules/ ./node_modules/
COPY src/data-source.ts ./src/data-source.ts
COPY src/migrations/ ./src/migrations/
COPY .env ./
COPY uploads/ ./uploads/

EXPOSE 3000

CMD ["node", "dist/main.js"]