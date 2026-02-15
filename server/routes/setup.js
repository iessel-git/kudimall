/**
 * Production Database Setup Endpoint
 * This endpoint runs the necessary database migrations on production
 * SECURITY: This should be disabled after initial setup
 */

const express = require('express');
const router = express.Router();
const Database = require('../models/database');

// TEMP: Production migration endpoint - REMOVE after setup
router.post('/setup-database', async (req, res) => {
    try {
        console.log('🔄 Starting production database setup...');
        
        // Read and execute schema files
        const fs = require('fs');
        const path = require('path');
        
        // 1. Base schema 
        const initSchema = fs.readFileSync(
            path.join(__dirname, '../migrations/init_schema_postgres.sql'), 
            'utf8'
        );
        console.log('📋 Applying base schema...');
        await Database.executeRawQuery(initSchema);
        
        // 2. Missing columns (includes verification codes)
        const missingColumns = fs.readFileSync(
            path.join(__dirname, '../migrations/add_missing_columns.sql'), 
            'utf8'
        );
        console.log('📋 Adding missing columns...');
        await Database.executeRawQuery(missingColumns);
        
        // 3. E-commerce features (includes flash_deals)
        const ecommerceFeatures = fs.readFileSync(
            path.join(__dirname, '../migrations/add_ecommerce_features.sql'), 
            'utf8'
        );
        console.log('📋 Adding e-commerce features...');
        await Database.executeRawQuery(ecommerceFeatures);
        
        // 4. Flash deals indexes
        const flashDealsIndexes = fs.readFileSync(
            path.join(__dirname, '../migrations/add_flash_deals_indexes.sql'), 
            'utf8'
        );
        console.log('📋 Adding flash deals indexes...');
        await Database.executeRawQuery(flashDealsIndexes);
        
        console.log('✅ Production database setup completed!');
        
        // Check what tables we have
        const tables = await Database.executeRawQuery(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('📋 Tables created:', tables.map(t => t.table_name));
        
        res.json({
            success: true,
            message: 'Database setup completed successfully',
            tables: tables.map(t => t.table_name)
        });
        
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        res.status(500).json({
            error: 'Database setup failed',
            details: error.message
        });
    }
});

module.exports = router;