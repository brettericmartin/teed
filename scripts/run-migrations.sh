#!/bin/bash

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Check for required environment variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing required environment variables"
  echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  exit 1
fi

# Extract project ref from Supabase URL
PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -n 's/.*\/\/\([^.]*\).*/\1/p')

echo "🚀 Starting Teed Schema Migrations"
echo "═══════════════════════════════════════════════════════════"
echo "Project: $PROJECT_REF"
echo ""

# Function to run a migration
run_migration() {
  local migration_file=$1
  local migration_name=$(basename $migration_file .sql)

  echo "🔄 Running migration: $migration_name"
  echo "───────────────────────────────────────────────────────────"

  # Read SQL file
  SQL_CONTENT=$(cat "$migration_file")

  # Execute SQL via Supabase REST API
  RESPONSE=$(curl -s -X POST \
    "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"query\":$(echo "$SQL_CONTENT" | jq -Rs .)}")

  # Check for errors
  if echo "$RESPONSE" | grep -q "error"; then
    echo "❌ Migration failed: $migration_name"
    echo "$RESPONSE" | jq '.'
    return 1
  else
    echo "✅ Migration completed: $migration_name"
    return 0
  fi
}

# Counter for success/failure
SUCCESS_COUNT=0
FAIL_COUNT=0
TOTAL_COUNT=0

# Run migrations in order
for migration_file in scripts/migrations/*.sql; do
  TOTAL_COUNT=$((TOTAL_COUNT + 1))
  if run_migration "$migration_file"; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
  fi
  echo ""
done

echo "═══════════════════════════════════════════════════════════"
echo "📊 Migration Summary"
echo "═══════════════════════════════════════════════════════════"
echo "✅ Successful: $SUCCESS_COUNT"
echo "❌ Failed: $FAIL_COUNT"
echo "📝 Total: $TOTAL_COUNT"
echo ""

if [ $FAIL_COUNT -gt 0 ]; then
  echo "⚠️  Some migrations failed. Please check the errors above."
  exit 1
else
  echo "🎉 All migrations completed successfully!"
  exit 0
fi
