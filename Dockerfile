FROM node:24-slim AS builder

WORKDIR /app

# Set CI environment for pnpm
ENV CI=true

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

# Copy dist and public directories from builder
COPY --from=builder /app/artifacts/api-server/dist /app/dist
COPY --from=builder /app/artifacts/api-server/public /app/public

# Expose port
EXPOSE 8080

# Start server - Node will find dist/index.cjs from WORKDIR
CMD ["node", "dist/index.cjs"]
