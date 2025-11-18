require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function makeAdmin() {
  try {
    console.log('Холбогдож байна...');

    // Бүх хэрэглэгчдийг харах
    const allUsers = await pool.query('SELECT id, email, phone, is_admin FROM users');
    console.log('\nОдоогийн хэрэглэгчид:');
    allUsers.rows.forEach(u => {
      console.log(`  ID: ${u.id}, Email: ${u.email}, Phone: ${u.phone}, Admin: ${u.is_admin}`);
    });

    // Утасны дугаараар админ эрх өгөх
    const phone = '95556339';
    const result = await pool.query(
      'UPDATE users SET is_admin = true WHERE phone = $1 RETURNING *',
      [phone]
    );

    if (result.rows.length > 0) {
      console.log(`\n✓ ${phone} утастай хэрэглэгчид admin эрх өгөгдлөө`);
      console.log('  Email:', result.rows[0].email);
      console.log('  Name:', result.rows[0].first_name, result.rows[0].last_name);
    } else {
      console.log(`\n✗ ${phone} утастай хэрэглэгч олдсонгүй`);
      console.log('\nШинэ admin үүсгэж байна...');

      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = await pool.query(
        `INSERT INTO users (email, password, first_name, last_name, phone, register_number, is_admin)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        ['admin@omnicredit.mn', hashedPassword, 'Admin', 'User', phone, 'ADMIN001', true]
      );

      console.log('✓ Шинэ admin үүслээ:');
      console.log('  Email:', newAdmin.rows[0].email);
      console.log('  Phone:', phone);
      console.log('  Password: admin123');
    }

    await pool.end();
  } catch (error) {
    console.error('Алдаа:', error.message);
    await pool.end();
  }
}

makeAdmin();
