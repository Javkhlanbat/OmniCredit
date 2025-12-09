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
        term_months INTEGER NOT NULL,
        monthly_payment DECIMAL(12, 2) NOT NULL,
        total_amount DECIMAL(12, 2),
        purpose TEXT,
        monthly_income DECIMAL(12, 2),
        occupation VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP,
        disbursed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Loans table үүсгэсэн');

    // Add missing columns if they don't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'loans' AND column_name = 'disbursed_at'
        ) THEN
          ALTER TABLE loans ADD COLUMN disbursed_at TIMESTAMP;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'loans' AND column_name = 'total_amount'
        ) THEN
          ALTER TABLE loans ADD COLUMN total_amount DECIMAL(12, 2);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'loans' AND column_name = 'purpose'
        ) THEN
          ALTER TABLE loans ADD COLUMN purpose TEXT;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'loans' AND column_name = 'monthly_income'
        ) THEN
          ALTER TABLE loans ADD COLUMN monthly_income DECIMAL(12, 2);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'loans' AND column_name = 'occupation'
        ) THEN
          ALTER TABLE loans ADD COLUMN occupation VARCHAR(255);
        END IF;
        -- Rename duration_months to term_months if needed
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'loans' AND column_name = 'duration_months'
        ) AND NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'loans' AND column_name = 'term_months'
        ) THEN
          ALTER TABLE loans RENAME COLUMN duration_months TO term_months;
        ELSIF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'loans' AND column_name = 'term_months'
        ) THEN
          ALTER TABLE loans ADD COLUMN term_months INTEGER NOT NULL DEFAULT 12;
        END IF;
      END $$;
    `);
    console.log('Loans table-д дутуу column-ууд нэмэгдлээ');

    // Payments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        loan_id INTEGER REFERENCES loans(id) ON DELETE CASCADE,
        amount DECIMAL(12, 2) NOT NULL,
        principal_amount DECIMAL(12, 2) DEFAULT 0,
        interest_amount DECIMAL(12, 2) DEFAULT 0,
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_method VARCHAR(50),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Payments table үүсгэсэн');

    // Add missing columns to payments if they don't exist
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'payments' AND column_name = 'principal_amount'
        ) THEN
          ALTER TABLE payments ADD COLUMN principal_amount DECIMAL(12, 2) DEFAULT 0;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'payments' AND column_name = 'interest_amount'
        ) THEN
          ALTER TABLE payments ADD COLUMN interest_amount DECIMAL(12, 2) DEFAULT 0;
        END IF;
      END $$;
    `);
    console.log('Payments table-д principal_amount, interest_amount columns нэмэгдлээ');

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

    // Analytics Events table - analytics.js-ээс ирэх event-үүд
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        session_id VARCHAR(100),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        url VARCHAR(500),
        device_type VARCHAR(50),
        user_agent TEXT,
        screen_width INTEGER,
        screen_height INTEGER,
        viewport_width INTEGER,
        viewport_height INTEGER,
        event_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Analytics events table үүсгэсэн');

    // Funnel Sessions table - Analytics funnel tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS funnel_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        device_type VARCHAR(50),
        current_step VARCHAR(200),
        total_events INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Funnel sessions table үүсгэсэн');

    // User Sessions table - trackingService.js-ээс ирэх session tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        device_info JSONB,
        pages_visited INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        total_duration INTEGER DEFAULT 0,
        exit_page VARCHAR(500),
        converted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('User sessions table үүсгэсэн');

    // User Activities table - trackingService.js-ээс ирэх activity tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        session_id VARCHAR(100),
        page_url VARCHAR(500),
        page_title VARCHAR(500),
        action_type VARCHAR(100) NOT NULL,
        time_spent INTEGER DEFAULT 0,
        device_info JSONB,
        referrer VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('User activities table үүсгэсэн');

    // Add indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_session ON user_sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_activities_session ON user_activities(session_id);
      CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_activities_created ON user_activities(created_at);
    `);
    console.log('Analytics indexes үүсгэсэн');

    // Add is_admin and visit_count columns to users table for analytics
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'is_admin'
        ) THEN
          ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'visit_count'
        ) THEN
          ALTER TABLE users ADD COLUMN visit_count INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'loan_conversion_count'
        ) THEN
          ALTER TABLE users ADD COLUMN loan_conversion_count INTEGER DEFAULT 0;
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'age'
        ) THEN
          ALTER TABLE users ADD COLUMN age INTEGER;
        END IF;
      END $$;
    `);
    console.log('Users table-д analytics columns нэмэгдлээ');

    console.log('✅ Бүх tables амжилттай үүсгэгдлээ!');

  } catch (error) {
    console.error('Database initialization алдаа:', error);
    throw error;
  }
};

module.exports = { initDatabase };