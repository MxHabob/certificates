# اختياري: استخدام نسخة Node أخف
FROM node:jod-alpine3.21 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM node:jod-alpine3.21
WORKDIR /app

COPY --from=builder /app/dist ./dist

RUN npm install -g serve

EXPOSE 5413

CMD ["serve", "-s", "dist", "-l", "5413"]
