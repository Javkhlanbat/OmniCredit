require('dotenv').config();
const { Pool } = require('pg');

// DATABASE_URL ашиглан холбох
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const addColumns = async () => {
  try {
    console.log('PostgreSQL-д холбогдож байна...');
    console.log('URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));

    // Add register_number column if not exists
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS register_number VARCHAR(50);
    `);
    console.log('register_number column нэмэгдлээ');

    // Add id_front column if not exists
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS id_front TEXT;
    `);
    console.log('id_front column нэмэгдлээ');

    // Add id_back column if not exists
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS id_back TEXT;
    `);
    console.log('id_back column нэмэгдлээ');

    console.log('\nБүх columns амжилттай нэмэгдлээ!');

    // Check users table structure
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log('\nUsers table бүтэц:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('Алдаа гарлаа:', error.message);
    console.error('Дэлгэрэнгүй:', error);
    await pool.end();
    process.exit(1);
  }
};

addColumns();
