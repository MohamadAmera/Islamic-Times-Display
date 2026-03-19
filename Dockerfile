FROM node:24-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN bash build-prod.sh

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "artifacts/api-server/dist/index.cjs"]
