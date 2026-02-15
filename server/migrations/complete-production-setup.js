const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Render production database URL - use the correct one from earlier
const DATABASE_URL = "postgresql://kudimall_prod_user:RbOuNalVq6TCtMqiRUSnbxoVFUao3afX@dpg-d66jagdum26s7397epmg-a.oregon-postgres.render.com/kudimall_prod";

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runAllMigrations() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting complete database setup for production...');
    console.log('🔗 Connected to Render PostgreSQL');
    
    // 1. Base schema
    console.log('📋 1/4 - Running base schema...');
    const baseSchema = fs.readFileSync(path.join(__dirname, 'init_schema_postgres.sql'), 'utf8');
    await client.query(baseSchema);
    console.log('✅ Base schema applied');
    
    // 2. Missing columns (includes verification codes!)
    console.log('📋 2/4 - Adding missing columns...');
    const missingColumns = fs.readFileSync(path.join(__dirname, 'add_missing_columns.sql'), 'utf8');
    await client.query(missingColumns);
    console.log('✅ Missing columns added');
    
    // 3. E-commerce features (includes flash_deals!)
    console.log('📋 3/4 - Adding e-commerce features...');
    const ecommerceFeatures = fs.readFileSync(path.join(__dirname, 'add_ecommerce_features.sql'), 'utf8');
    await client.query(ecommerceFeatures);
    console.log('✅ E-commerce features added');
    
    // 4. Flash deals indexes
    console.log('📋 4/4 - Adding flash deals indexes...');
    const flashDealsIndexes = fs.readFileSync(path.join(__dirname, 'add_flash_deals_indexes.sql'), 'utf8');
    await client.query(flashDealsIndexes);
    console.log('✅ Flash deals indexes added');
    
    // Verify setup
    console.log('🔍 Verifying database setup...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Tables created:', tables.rows.length);
    console.log('📋 Tables:', tables.rows.map(t => t.table_name).join(', '));
    
    // Check verification columns specifically
    const sellerColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'sellers' 
      AND column_name LIKE '%verification%'
      ORDER BY column_name
    `);
    
    console.log('🔐 Seller verification columns:', sellerColumns.rows.map(c => c.column_name).join(', '));
    
    const buyerColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'buyers' 
      AND column_name LIKE '%verification%'
      ORDER BY column_name
    `);
    
    console.log('🔐 Buyer verification columns:', buyerColumns.rows.map(c => c.column_name).join(', '));
    
    // Check for flash_deals table
    const flashDealsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'flash_deals'
      )
    `);
    
    console.log('💫 Flash deals table exists:', flashDealsExists.rows[0].exists);
    
    console.log('🎉 Production database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runAllMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});