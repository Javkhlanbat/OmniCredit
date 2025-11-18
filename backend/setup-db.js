const { Client } = require('pg');

// Анхдагч postgres холболт
const adminClient = new Client({
  user: 'postgres',
  password: 'asdf',
  host: 'localhost',
  port: 5432,
  database: 'postgres' // Анхдагч системийн өгөгдлийн сан
});

const createDatabase = async () => {
  try {
    await adminClient.connect();
    console.log('PostgreSQL tei holbolt amjilttai bolloo.');
    await adminClient.query('CREATE DATABASE omnicredit;');
    console.log('"omnicredit" erembiig uusgesen!');
    await adminClient.end();
  } catch (error) {
    if (error.code === '42P04') {
      console.log('"omnicredit" erembe baina. uusgeh shardlaggui.');
      await adminClient.end();
    } else {
      console.error('Алдаа:', error.message);
      process.exit(1);
    }
  }
};

createDatabase();
