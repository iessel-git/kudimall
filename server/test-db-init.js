#!/usr/bin/env node
/**
 * Test script to verify database initialization and sellers.email column exists
 * This simulates what happens during server startup
 */

require('dotenv').config();
const db = require('./models/database');

async function testDatabaseInit() {
  console.log('🧪 Testing Database Initialization...\n');
  
  try {
    // Step 1: Check if sellers table exists
    console.log('Step 1: Checking if sellers table exists...');
    try {
      const result = await db.all('SELECT * FROM sellers LIMIT 1');
      console.log('✅ Sellers table exists\n');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠️  Sellers table does not exist, will be created during init\n');
      } else {
        throw error;
      }
    }
    
    // Step 2: Check if email column exists
    console.log('Step 2: Checking if sellers.email column exists...');
    try {
      const columns = await db.all(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'sellers' AND column_name = 'email'
      `);
      
      if (columns && columns.length > 0) {
        console.log('✅ Email column exists in sellers table');
        console.log('   - Type:', columns[0].data_type);
        console.log('   - Nullable:', columns[0].is_nullable);
      } else {
        console.log('❌ Email column does NOT exist in sellers table');
        console.log('   Running initDb to add missing columns...\n');
        
        // Run initDb
        const initDb = require('./scripts/initDb');
        await initDb();
        
        // Check again
        const columnsAfter = await db.all(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'sellers' AND column_name = 'email'
        `);
        
        if (columnsAfter && columnsAfter.length > 0) {
          console.log('✅ Email column successfully added!');
          console.log('   - Type:', columnsAfter[0].data_type);
          console.log('   - Nullable:', columnsAfter[0].is_nullable);
        } else {
          console.log('❌ Failed to add email column');
        }
      }
    } catch (error) {
      console.error('❌ Error checking email column:', error.message);
    }
    
    console.log('\nStep 3: Listing all sellers table columns...');
    try {
      const allColumns = await db.all(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'sellers'
        ORDER BY ordinal_position
      `);
      
      console.log('Columns in sellers table:');
      allColumns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });
    } catch (error) {
      console.error('Error listing columns:', error.message);
    }
    
    // Step 4: Test inserting a seller with email
    console.log('\nStep 4: Testing seller signup query...');
    try {
      // This simulates what the signup endpoint does
      const testQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sellers' 
          AND column_name IN ('name', 'slug', 'email', 'password', 'phone', 'location', 'description')
      `;
      
      const requiredColumns = await db.all(testQuery);
      const columnNames = requiredColumns.map(c => c.column_name);
      
      console.log('Required columns for seller signup:');
      const needed = ['name', 'slug', 'email', 'password', 'phone', 'location', 'description'];
      needed.forEach(col => {
        const exists = columnNames.includes(col);
        console.log(`   ${exists ? '✅' : '❌'} ${col}`);
      });
      
      const allExist = needed.every(col => columnNames.includes(col));
      if (allExist) {
        console.log('\n✅ All required columns exist - seller signup should work!');
      } else {
        console.log('\n❌ Some required columns are missing - seller signup will fail');
      }
    } catch (error) {
      console.error('Error checking required columns:', error.message);
    }
    
    console.log('\n✅ Database initialization test complete!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await db.close();
    process.exit(0);
  }
}

// Run the test
testDatabaseInit();
