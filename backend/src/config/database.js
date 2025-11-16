const { Pool } = require('pg');

// PostgreSQL холболтын тохиргоо
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Холболт тест
pool.on('connect', () => {
  console.log('PostgreSQL холбогдсон');
});

pool.on('error', (err) => {
  console.error('PostgreSQL алдаа:', err);
});

// Query function
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('✓ Query executed:', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('✗ Query error:', error);
    throw error;
  }
};

module.exports = {
  pool,
  query
};