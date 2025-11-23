const { pool } = require('./database');

// Database tables үүсгэх
const initDatabase = async () => {
  try {
    console.log('📊 Database tables үүсгэж байна...');

    // Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        register_number VARCHAR(20) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table үүсгэсэн');

    // Loans table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        loan_type VARCHAR(50) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        interest_rate DECIMAL(5, 2) NOT NULL,
        duration_months INTEGER NOT NULL,
        monthly_payment DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        disbursed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Loans table үүсгэсэн');

    // Add disbursed_at column if it doesn't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'loans' AND column_name = 'disbursed_at'
        ) THEN
          ALTER TABLE loans ADD COLUMN disbursed_at TIMESTAMP;
        END IF;
      END $$;
    `);
    console.log('Loans table-д disbursed_at column нэмэгдлээ');

    // Payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        loan_id INTEGER REFERENCES loans(id) ON DELETE CASCADE,
        amount DECIMAL(12, 2) NOT NULL,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Payments table үүсгэсэн');

    // Purchase loans table (0% хүүтэй)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS purchase_loans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        invoice_code VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        duration_months INTEGER NOT NULL,
        monthly_payment DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Purchase loans table үүсгэсэн');

    console.log('Бүх tables амжилттай үүсгэгдлээ!');
    
  } catch (error) {
    console.error('Database initialization алдаа:', error);
    throw error;
  }
};

module.exports = { initDatabase };