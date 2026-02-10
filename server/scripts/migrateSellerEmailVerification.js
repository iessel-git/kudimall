const db = require('../models/database');

async function addColumnIfMissing(tableName, columnName, columnDefinition) {
  try {
    const tableInfo = await db.all(`PRAGMA table_info(${tableName})`);
    const columnExists = tableInfo.some(col => col.name === columnName);
    
    if (!columnExists) {
      console.log(`Adding column ${columnName} to ${tableName}...`);
      await db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
      console.log(`✓ Added ${columnName}`);
      return true;
    } else {
      console.log(`Column ${columnName} already exists in ${tableName}`);
      return false;
    }
  } catch (error) {
    console.error(`Error adding column ${columnName}:`, error.message);
    throw error;
  }
}

async function migrateSellersEmailVerification() {
  try {
    console.log('Starting email verification migration for sellers...\n');
    
    let changesMade = false;
    
    // Add email_verified column
    const added1 = await addColumnIfMissing('sellers', 'email_verified', 'BOOLEAN DEFAULT 0');
    changesMade = changesMade || added1;
    
    // Add email_verification_token column
    const added2 = await addColumnIfMissing('sellers', 'email_verification_token', 'TEXT');
    changesMade = changesMade || added2;
    
    // Add email_verification_expires column
    const added3 = await addColumnIfMissing('sellers', 'email_verification_expires', 'DATETIME');
    changesMade = changesMade || added3;
    
    if (changesMade) {
      console.log('\n✅ Migration complete: Email verification fields added to sellers table');
    } else {
      console.log('\n✅ Migration complete: No changes needed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateSellersEmailVerification();
