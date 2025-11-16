require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testDB() {
  try {
    console.log('🔍 Checking database directly...\n');

    const result = await pool.query(
      'SELECT id, email, first_name, last_name, is_admin, created_at FROM users ORDER BY id'
    );

    console.log(`Found ${result.rows.length} users:\n`);

    result.rows.forEach(user => {
      console.log(`${user.id}. ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   is_admin: ${user.is_admin} (type: ${typeof user.is_admin})`);
      console.log('');
    });

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

testDB();
