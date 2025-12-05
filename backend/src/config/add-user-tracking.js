const { pool } = require('./database');

const addUserTracking = async () => {
  try {
    console.log('Adding user tracking tables...');

    // User activities table - tracks every page visit and action
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        page_url VARCHAR(500) NOT NULL,
        page_title VARCHAR(200),
        action_type VARCHAR(50) NOT NULL,
        time_spent INTEGER DEFAULT 0,
        device_info JSONB,
        referrer VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_activities_user ON user_activities(user_id);
      CREATE INDEX IF NOT EXISTS idx_activities_session ON user_activities(session_id);
      CREATE INDEX IF NOT EXISTS idx_activities_date ON user_activities(created_at);
    `);

    // User sessions table - tracks complete user sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        total_duration INTEGER DEFAULT 0,
        pages_visited INTEGER DEFAULT 0,
        converted BOOLEAN DEFAULT FALSE,
        device_info JSONB,
        exit_page VARCHAR(500)
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_date ON user_sessions(started_at);
    `);

    // Add demographic data to users table for predictive analytics
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS age INTEGER,
      ADD COLUMN IF NOT EXISTS gender VARCHAR(20),
      ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS loan_conversion_count INTEGER DEFAULT 0;
    `);

    console.log('✓ User tracking tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

addUserTracking();
