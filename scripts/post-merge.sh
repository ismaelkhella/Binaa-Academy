#!/bin/bash
set -e

echo "==> Installing API dependencies..."
cd api
npm install --prefer-offline

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Pushing schema to database..."
npx prisma db push --accept-data-loss

echo "==> Installing Admin dependencies..."
cd ../admin
npm install --prefer-offline

echo "==> Post-merge setup complete."
