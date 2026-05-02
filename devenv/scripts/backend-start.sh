#!/bin/sh
set -e

echo "Pushing database schema..."
npx prisma db push --force-reset --accept-data-loss

echo "Seeding database..."
npm run seed

echo "Starting server..."
npm run start
