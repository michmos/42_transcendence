#!/bin/sh
# If there is no database yet, push the schema to create it
# Extract file path from DATABASE_URL (remove file: prefix if present)
DB_FILE=${DATABASE_URL#file:}

if [ ! -f "${DB_FILE}" ]; then
  echo "Database file does not exist. Pushing schema to create database..."
  pnpm prisma db push --schema=./schema.prisma
else
  echo "Database file already exists. Skipping schema push."
fi