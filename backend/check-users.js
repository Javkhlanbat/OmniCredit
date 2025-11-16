require('dotenv').config();
const { Pool } = require('pg');

// DATABASE_URL ашиглан холбох
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const checkUsers = async () => {
  try {
    console.log('🔄 PostgreSQL-д холбогдож байна...');
    console.log('📍 URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));

    // Get all users with their phone numbers
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, phone, is_admin, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    console.log('\n📊 Нийт хэрэглэгчид:', result.rows.length);
    console.log('\n' + '='.repeat(80));

    result.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Phone: "${user.phone}" (length: ${user.phone?.length || 0})`);
      console.log(`   Is Admin: ${user.is_admin}`);
      console.log(`   Created: ${user.created_at}`);
    });

    console.log('\n' + '='.repeat(80));

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Алдаа гарлаа:', error.message);
    console.error('📝 Дэлгэрэнгүй:', error);
    await pool.end();
    process.exit(1);
  }
};

checkUsers();
