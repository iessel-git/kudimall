const db = require('../models/database');

const migrateSellerTable = async () => {
  try {
    console.log('🔧 Migrating sellers table to add authentication columns...');

    // Check if password column exists
    const tableInfo = await db.all('PRAGMA table_info(sellers)');
    const hasPassword = tableInfo.some(col => col.name === 'password');
    
    if (!hasPassword) {
      console.log('Adding password column...');
      await db.run('ALTER TABLE sellers ADD COLUMN password TEXT');
    }

    const hasIsActive = tableInfo.some(col => col.name === 'is_active');
    if (!hasIsActive) {
      console.log('Adding is_active column...');
      await db.run('ALTER TABLE sellers ADD COLUMN is_active BOOLEAN DEFAULT 1');
    }

    const hasLastLogin = tableInfo.some(col => col.name === 'last_login');
    if (!hasLastLogin) {
      console.log('Adding last_login column...');
      await db.run('ALTER TABLE sellers ADD COLUMN last_login DATETIME');
    }

    const hasUpdatedAt = tableInfo.some(col => col.name === 'updated_at');
    if (!hasUpdatedAt) {
      console.log('Adding updated_at column...');
      await db.run('ALTER TABLE sellers ADD COLUMN updated_at DATETIME');
    }

    console.log('✅ Sellers table migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error migrating sellers table:', error);
    process.exit(1);
  }
};

migrateSellerTable();
