require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// DATABASE_URL ашиглан холбо
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createAdmin = async () => {
  try {
    console.log('PostgreSQL-д холбогдож байна...');
    console.log('URL:', process.env.DATABASE_URL?.replace(/:[^:]*@/, ':****@'));

    // Check if admin user already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE phone = $1 OR email = $2',
      ['95556339', 'admin@omnicredit.mn']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin хэрэглэгч аль хэдийн байна!');
      console.log('   Email:', existingAdmin.rows[0].email);
      console.log('   Phone:', existingAdmin.rows[0].phone);
      console.log('   Is Admin:', existingAdmin.rows[0].is_admin);

      // Update existing user to be admin
      await pool.query(
        'UPDATE users SET is_admin = true WHERE id = $1',
        [existingAdmin.rows[0].id]
      );
      console.log('Хэрэглэгчийг admin болголоо');

      await pool.end();
      process.exit(0);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (
        email,
        password,
        first_name,
        last_name,
        phone,
        register_number,
        is_admin,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, email, first_name, last_name, phone, is_admin`,
      [
        'admin@omnicredit.mn',
        hashedPassword,
        'Admin',
        'User',
        '95556339',
        'ADMIN001',
        true
      ]
    );

    console.log('\nAdmin хэрэглэгч амжилттай үүслээ!');
    console.log('\nAdmin мэдээлэл:');
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Email: ${result.rows[0].email}`);
    console.log(`   Phone: ${result.rows[0].phone}`);
    console.log(`   Password: admin123`);
    console.log(`   Is Admin: ${result.rows[0].is_admin}`);
    console.log('\nУтас: 95556339');
    console.log('Нууц үг: admin123');

    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('Алдаа гарлаа:', error.message);
    console.error('Дэлгэрэнгүй:', error);
    await pool.end();
    process.exit(1);
  }
};

createAdmin();
