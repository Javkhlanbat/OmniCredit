require('dotenv').config();
const { pool } = require('./src/config/database');

async function createAnalyticsTables() {
  const client = await pool.connect();

  try {
    console.log('Creating analytics tables...');

    // Analytics Events Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(50) NOT NULL,
        session_id VARCHAR(100) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        url VARCHAR(500),
        device_type VARCHAR(20),
        user_agent TEXT,
        screen_width INTEGER,
        screen_height INTEGER,
        viewport_width INTEGER,
        viewport_height INTEGER,
        event_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics_events(session_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_analytics_url ON analytics_events(url);
    `);

    // Funnel Steps Table (хэрэглэгчийн аялал)
    await client.query(`
      CREATE TABLE IF NOT EXISTS funnel_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        device_type VARCHAR(20),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        current_step VARCHAR(50),
        completed BOOLEAN DEFAULT false,
        drop_off_step VARCHAR(50),
        total_events INTEGER DEFAULT 0,
        scroll_depth INTEGER DEFAULT 0,
        form_errors INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Analytics tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating analytics tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createAnalyticsTables()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = { createAnalyticsTables };
