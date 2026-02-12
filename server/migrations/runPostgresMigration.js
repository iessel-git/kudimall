const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/kudimall',
});

async function runPostgresMigration() {
  const schemaPath = path.join(__dirname, 'init_schema_postgres.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const client = await pool.connect();
  try {
    console.log('🔄 Running PostgreSQL migration...');
    await client.query(sql);
    console.log('✅ PostgreSQL migration completed successfully!');
  } catch (error) {
    console.error('❌ PostgreSQL migration failed:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runPostgresMigration();
}

module.exports = runPostgresMigration;
