const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'kudimall.db');
const db = new sqlite3.Database(dbPath);

console.log('Starting buyer password reset migration...');

db.serialize(() => {
  // Check if columns exist
  db.all("PRAGMA table_info(buyers)", (err, columns) => {
    if (err) {
      console.error('Error checking columns:', err);
      return;
    }

    const hasResetToken = columns.some(col => col.name === 'reset_token');
    const hasResetTokenExpiry = columns.some(col => col.name === 'reset_token_expiry');

    if (hasResetToken && hasResetTokenExpiry) {
      console.log('✓ Password reset columns already exist');
      db.close();
      return;
    }

    // Add reset_token column
    if (!hasResetToken) {
      db.run(`
        ALTER TABLE buyers 
        ADD COLUMN reset_token TEXT
      `, (err) => {
        if (err) {
          console.error('Error adding reset_token column:', err);
        } else {
          console.log('✓ Added reset_token column');
        }
      });
    }

    // Add reset_token_expiry column
    if (!hasResetTokenExpiry) {
      db.run(`
        ALTER TABLE buyers 
        ADD COLUMN reset_token_expiry TEXT
      `, (err) => {
        if (err) {
          console.error('Error adding reset_token_expiry column:', err);
        } else {
          console.log('✓ Added reset_token_expiry column');
        }
        
        // Close database after all operations
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('✓ Migration completed successfully');
          }
        });
      });
    } else {
      db.close();
    }
  });
});
