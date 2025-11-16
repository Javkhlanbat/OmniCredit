require('dotenv').config();
const { Pool } = require('pg');

// DATABASE_URL ашиглан холбох
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createTables = async () => {
  try {
    console.log('🔄 Railway PostgreSQL-д холбогдож байна...');
    console.log('📍 URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table үүслээ');

    // Loans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(12, 2) NOT NULL,
        term_months INTEGER NOT NULL,
        interest_rate DECIMAL(5, 2) NOT NULL,
        monthly_payment DECIMAL(12, 2) NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        purpose VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending',
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Loans table үүслээ');

    // Payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        loan_id INTEGER REFERENCES loans(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(12, 2) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50),
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Payments table үүслээ');

    // Purchase loans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_loans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        merchant_name VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        term_months INTEGER NOT NULL,
        interest_rate DECIMAL(5, 2) NOT NULL,
        monthly_payment DECIMAL(12, 2) NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        approved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Purchase_loans table үүслээ');

    console.log('\n🎉 Бүх tables амжилттай үүслээ!');

    // Count check
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM loans) as loans_count,
        (SELECT COUNT(*) FROM payments) as payments_count,
        (SELECT COUNT(*) FROM purchase_loans) as purchase_loans_count
    `);

    console.log('\n📊 Database статистик:');
    console.log(`   Users: ${result.rows[0].users_count}`);
    console.log(`   Loans: ${result.rows[0].loans_count}`);
    console.log(`   Payments: ${result.rows[0].payments_count}`);
    console.log(`   Purchase Loans: ${result.rows[0].purchase_loans_count}`);

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Алдаа гарлаа:', error.message);
    console.error('📝 Дэлгэрэнгүй:', error);
    await pool.end();
    process.exit(1);
  }
};

createTables();
