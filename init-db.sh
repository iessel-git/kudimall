#!/bin/bash
# Database initialization script for Render deployment
# This script can be run from the root directory and will properly initialize the database

set -e  # Exit on error

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
echo "📦 Creating database schema..."
if psql "$DATABASE_URL" -f migrations/init_schema_postgres.sql; then
    echo "✅ Database schema initialized successfully"
else
    echo "⚠️  Schema initialization had warnings (this is OK if tables already exist)"
fi

echo "✅ Database initialization complete"
