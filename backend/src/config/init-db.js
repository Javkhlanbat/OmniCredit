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
        id_front TEXT,
        id_back TEXT,
        profile_image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table үүсгэсэн');

    // Add id_front, id_back, profile_image columns if they don't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'id_front'
        ) THEN
          ALTER TABLE users ADD COLUMN id_front TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'id_back'
        ) THEN
          ALTER TABLE users ADD COLUMN id_back TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'profile_image'
        ) THEN
          ALTER TABLE users ADD COLUMN profile_image TEXT;
        END IF;
      END $$;
    `);
    console.log('Users table-д id_front, id_back, profile_image columns нэмэгдлээ');

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

    // Wallets table - Хэрэглэгч бүрт нэг wallet
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        balance DECIMAL(12, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Wallets table үүсгэсэн');

    // Wallet transactions table - Wallet гүйлгээний түүх
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id SERIAL PRIMARY KEY,
        wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        description TEXT,
        reference_id INTEGER,
        reference_type VARCHAR(50),
        balance_after DECIMAL(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Wallet transactions table үүсгэсэн');

    // Companies table - Компаниуд
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        address TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Companies table үүсгэсэн');

    // Promo codes table - Нэмэгдлийн кодууд
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_percent DECIMAL(5, 2) DEFAULT 0,
        interest_rate_override DECIMAL(5, 2),
        max_loan_amount DECIMAL(12, 2),
        max_uses INTEGER,
        used_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        expires_at TIMESTAMP,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Promo codes table үүсгэсэн');

    // Add promo_code_id to loans table
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'loans' AND column_name = 'promo_code_id'
        ) THEN
          ALTER TABLE loans ADD COLUMN promo_code_id INTEGER REFERENCES promo_codes(id);
        END IF;
      END $$;
    `);
    console.log('Loans table-д promo_code_id column нэмэгдлээ');

    console.log('Бүх tables амжилттай үүсгэгдлээ!');
    
  } catch (error) {
    console.error('Database initialization алдаа:', error);
    throw error;
  }
};

module.exports = { initDatabase };