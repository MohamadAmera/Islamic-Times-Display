#!/bin/bash
set -e

echo "=== Building Al-Noor for production ==="

# 1. Build shared libs
echo "Building shared libraries..."
pnpm run typecheck:libs

# 2. Build frontend
echo "Building frontend (Vite)..."
pnpm --filter @workspace/al-noor run build

# 3. Build API server
echo "Building API server (esbuild)..."
pnpm --filter @workspace/api-server run build

# 4. Copy frontend build into the API server's public folder
#    API server dist/index.cjs uses __dirname = artifacts/api-server/dist/
#    so ../public resolves to artifacts/api-server/public/
echo "Copying frontend assets to API server..."
mkdir -p artifacts/api-server/public
cp -r artifacts/al-noor/dist/public/. artifacts/api-server/public/

echo "=== Build complete ==="
