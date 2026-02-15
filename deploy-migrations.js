const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// You'll need to get your DATABASE_URL from Render dashboard
const DATABASE_URL = process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found. Please set your Render database URL.');
    console.log('📝 Get it from: Render Dashboard > kudimall-db > Connections > Internal Database URL');
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function runMigrations() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Starting database migrations...');
        
        // 1. Run base schema first
        console.log('📋 Running base schema...');
        const baseSchema = fs.readFileSync(path.join(__dirname, 'server/migrations/init_schema_postgres.sql'), 'utf8');
        await client.query(baseSchema);
        console.log('✅ Base schema applied');
        
        // 2. Run missing columns (includes verification code columns)
        console.log('📋 Adding missing columns...');
        const missingColumns = fs.readFileSync(path.join(__dirname, 'server/migrations/add_missing_columns.sql'), 'utf8');
        await client.query(missingColumns);
        console.log('✅ Missing columns added');
        
        // 3. Run ecommerce features (includes flash_deals table)
        console.log('📋 Adding ecommerce features...');
        const ecommerceFeatures = fs.readFileSync(path.join(__dirname, 'server/migrations/add_ecommerce_features.sql'), 'utf8');
        await client.query(ecommerceFeatures);
        console.log('✅ Ecommerce features added');
        
        // 4. Add flash deals indexes
        console.log('📋 Adding flash deals indexes...');
        const flashDealsIndexes = fs.readFileSync(path.join(__dirname, 'server/migrations/add_flash_deals_indexes.sql'), 'utf8');
        await client.query(flashDealsIndexes);
        console.log('✅ Flash deals indexes added');
        
        console.log('🎉 All migrations completed successfully!');
        console.log('📊 Checking table counts...');
        
        // Check what we have now
        const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('📋 Tables in database:', tables.rows.map(r => r.table_name).join(', '));
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

if (require.main === module) {
    runMigrations();
}

module.exports = runMigrations;