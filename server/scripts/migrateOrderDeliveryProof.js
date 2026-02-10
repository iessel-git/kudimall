const db = require('../models/database');

const addColumnIfMissing = async (tableName, columnName, columnType) => {
  const columns = await db.all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    await db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`);
    console.log(`Added column ${columnName} to ${tableName}`);
  }
};

const migrate = async () => {
  try {
    console.log('🔧 Migrating orders table for delivery proof...');

    const columnsToAdd = [
      { name: 'delivery_person_id', type: 'INTEGER' },
      { name: 'tracking_number', type: 'TEXT' },
      { name: 'shipped_at', type: 'DATETIME' },
      { name: 'delivered_at', type: 'DATETIME' },
      { name: 'buyer_confirmed_at', type: 'DATETIME' },
      { name: 'delivery_proof_type', type: 'TEXT' },
      { name: 'delivery_proof_url', type: 'TEXT' },
      { name: 'delivery_signature_name', type: 'TEXT' },
      { name: 'delivery_signature_data', type: 'TEXT' },
      { name: 'delivery_photo_uploaded_by', type: 'TEXT' },
      { name: 'delivery_signature_uploaded_by', type: 'TEXT' }
    ];

    for (const column of columnsToAdd) {
      await addColumnIfMissing('orders', column.name, column.type);
    }

    console.log('✅ Migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
