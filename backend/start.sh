#!/bin/sh

echo "Pushing database schema..."
npx prisma db push --accept-data-loss

echo "Seeding database..."
npm run seed

echo "Starting server..."
npm run start
