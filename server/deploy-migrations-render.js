const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Use the Render database URL
const DATABASE_URL = process.env.RENDER_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found. Please set your Render database URL.');
    console.log('📝 Set it with: $env:RENDER_DATABASE_URL = "your-render-db-url"');
    process.exit(1);
}

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }  // Required for Render
});

async function runMigrations() {
    const client = await pool.connect();
    
    try {
        console.log('🔄 Starting database migrations on Render...');
        console.log('🔗 Connected to:', DATABASE_URL.split('@')[1]); // Hide credentials
        
        // 1. Run base schema first
        console.log('📋 Running base schema...');
        const baseSchema = fs.readFileSync(path.join(__dirname, 'migrations/init_schema_postgres.sql'), 'utf8');
        await client.query(baseSchema);
        console.log('✅ Base schema applied');
        
        // 2. Run missing columns (includes verification code columns)
        console.log('📋 Adding missing columns...');
        const missingColumns = fs.readFileSync(path.join(__dirname, 'migrations/add_missing_columns.sql'), 'utf8');
        await client.query(missingColumns);
        console.log('✅ Missing columns added (verification codes included)');
        
        // 3. Run ecommerce features (includes flash_deals table)
        console.log('📋 Adding ecommerce features...');
        const ecommerceFeatures = fs.readFileSync(path.join(__dirname, 'migrations/add_ecommerce_features.sql'), 'utf8');
        await client.query(ecommerceFeatures);
        console.log('✅ Ecommerce features added (flash_deals table created)');
        
        // 4. Add flash deals indexes
        console.log('📋 Adding flash deals indexes...');
        const flashDealsIndexes = fs.readFileSync(path.join(__dirname, 'migrations/add_flash_deals_indexes.sql'), 'utf8');
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
        
        // Check for verification columns
        const verificationColumns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'sellers' 
            AND column_name LIKE '%verification%';
        `);
        
        console.log('🔐 Verification columns in sellers table:', 
            verificationColumns.rows.map(r => r.column_name).join(', '));
            
        const buyersColumns = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'buyers' 
            AND column_name LIKE '%verification%';
        `);
        
        console.log('🔐 Verification columns in buyers table:', 
            buyersColumns.rows.map(r => r.column_name).join(', '));
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Error details:', error);
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