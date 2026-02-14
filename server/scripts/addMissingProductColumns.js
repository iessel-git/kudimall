const db = require('../models/database');

const addMissingProductColumns = async () => {
  try {
    console.log('🔧 Adding missing columns to products table...');
    
    // Add images column
    try {
      await db.run(`ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB`);
      console.log('✅ Added images column');
    } catch (e) {
      console.log('⚠️  images column: ' + e.message);
    }
    
    // Add is_featured column
    try {
      await db.run(`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE`);
      console.log('✅ Added is_featured column');
    } catch (e) {
      console.log('⚠️  is_featured column: ' + e.message);
    }
    
    // Add views column (for future use)
    try {
      await db.run(`ALTER TABLE products ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0`);
      console.log('✅ Added views column');
    } catch (e) {
      console.log('⚠️  views column: ' + e.message);
    }
    
    // Add sales column (for future use)
    try {
      await db.run(`ALTER TABLE products ADD COLUMN IF NOT EXISTS sales INTEGER DEFAULT 0`);
      console.log('✅ Added sales column');
    } catch (e) {
      console.log('⚠️  sales column: ' + e.message);
    }
    
    // Add updated_at column
    try {
      await db.run(`ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      console.log('✅ Added updated_at column');
    } catch (e) {
      console.log('⚠️  updated_at column: ' + e.message);
    }
    
    console.log('\n✅ Products table updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating products table:', error);
    process.exit(1);
  }
};

addMissingProductColumns();
