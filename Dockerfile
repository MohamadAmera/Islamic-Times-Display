FROM node:24-slim as builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN bash build-prod.sh

# Production stage
FROM node:24-slim

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/artifacts/api-server/public ./public

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "dist/index.cjs"]
