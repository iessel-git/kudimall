#!/bin/bash
# Database initialization script for Render deployment
# This script can be run from the root directory and will properly initialize the database

echo "🔧 Initializing KudiMall Database..."

# Determine the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"

# Check if we have DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Change to server directory where migration files are located
cd "$SERVER_DIR"

# Run the main schema initialization
# Note: This uses CREATE TABLE IF NOT EXISTS, so it's safe to run multiple times
echo "📦 Creating database schema..."
psql "$DATABASE_URL" -f migrations/init_schema_postgres.sql 2>&1 | tee /tmp/db_init.log

# Check if there were errors (ignoring warnings about existing tables)
if grep -qi "ERROR" /tmp/db_init.log && ! grep -qi "already exists" /tmp/db_init.log; then
    echo "❌ Database initialization failed with errors"
    exit 1
else
    echo "✅ Database schema initialized successfully"
fi

# Run additional columns migration
# Note: This uses ADD COLUMN IF NOT EXISTS, so it's safe to run multiple times
echo "📦 Adding additional columns for API routes..."
psql "$DATABASE_URL" -f migrations/add_missing_columns.sql 2>&1 | tee /tmp/db_columns.log

if grep -qi "ERROR" /tmp/db_columns.log && ! grep -qi "already exists" /tmp/db_columns.log; then
    echo "⚠️  Some columns could not be added (this may be OK if they already exist)"
else
    echo "✅ Additional columns added successfully"
fi

echo "✅ Database initialization complete"
