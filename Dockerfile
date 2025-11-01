# Build stage
FROM node:20-alpine3.21 AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine3.21
WORKDIR /app

COPY --from=builder /app/dist ./dist
RUN npm install -g serve

EXPOSE 5413
CMD ["serve", "-s", "dist", "-l", "tcp://0.0.0.0:5413"]
