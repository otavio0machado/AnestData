#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push --skip-generate

echo "Running seed..."
node dist/prisma/seed.js

echo "Starting server..."
exec node dist/index.js
