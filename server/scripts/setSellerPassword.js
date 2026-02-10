const bcrypt = require('bcryptjs');
const db = require('../models/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const setPasswordForSeller = async () => {
  try {
    console.log('🔧 Set Password for Existing Sellers\n');

    // Get all sellers without passwords
    const sellersWithoutPassword = await db.all(
      'SELECT id, name, email, slug FROM sellers WHERE password IS NULL OR password = ""'
    );

    if (sellersWithoutPassword.length === 0) {
      console.log('✅ All sellers already have passwords set!');
      process.exit(0);
    }

    console.log(`Found ${sellersWithoutPassword.length} seller(s) without password:\n`);
    
    sellersWithoutPassword.forEach((seller, index) => {
      console.log(`${index + 1}. ${seller.name} (${seller.email}) - Slug: ${seller.slug}`);
    });

    console.log('\n');

    // Ask which seller
    const sellerIndex = await question('Enter the number of the seller: ');
    const selectedSeller = sellersWithoutPassword[parseInt(sellerIndex) - 1];

    if (!selectedSeller) {
      console.log('❌ Invalid selection!');
      process.exit(1);
    }

    console.log(`\nSetting password for: ${selectedSeller.name} (${selectedSeller.email})`);

    // Ask for password
    const password = await question('Enter new password (min 6 characters): ');

    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters long!');
      process.exit(1);
    }

    // Confirm password
    const confirmPassword = await question('Confirm password: ');

    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match!');
      process.exit(1);
    }

    // Hash password
    console.log('\n🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update seller
    await db.run(
      'UPDATE sellers SET password = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, selectedSeller.id]
    );

    console.log('\n✅ Password set successfully!');
    console.log(`\n📧 Seller can now login with:`);
    console.log(`   Email: ${selectedSeller.email}`);
    console.log(`   Password: [the password you just set]`);
    console.log(`   Login URL: http://localhost:3000/seller/login\n`);

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting password:', error);
    rl.close();
    process.exit(1);
  }
};

setPasswordForSeller();
