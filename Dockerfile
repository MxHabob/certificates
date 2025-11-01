# اختياري: استخدام نسخة Node أخف
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

FROM node:18-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist

RUN npm install -g serve

EXPOSE 5413

CMD ["serve", "-s", "dist", "-l", "5413"]
