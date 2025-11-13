const { Client } = require('pg');

// Анхдагч postgres өрөмбөлсөн холболт
const adminClient = new Client({
  user: 'postgres',
  password: 'asdf',
  host: 'localhost',
  port: 5432,
  database: 'postgres' // Анхдагч өрөмбийг ашиглаж омницред үүсгэх
});

const createDatabase = async () => {
  try {
    await adminClient.connect();
    console.log('✅ PostgreSQL-тэй холбогдсон');

    // Өрөмбийг үүсгэх
    await adminClient.query('CREATE DATABASE omnicredit;');
    console.log('✅ "omnicredit" өрөмбийг амжилттай үүсгэсэн!');

    await adminClient.end();
  } catch (error) {
    if (error.code === '42P04') {
      console.log('ℹ️  "omnicredit" өрөмбийг аль хэдийнэ оршин байна');
      await adminClient.end();
    } else {
      console.error('❌ Алдаа:', error.message);
      process.exit(1);
    }
  }
};

createDatabase();
