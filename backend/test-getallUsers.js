require('dotenv').config();
const { getAllUsers } = require('./src/models/userModel');

async function test() {
  try {
    console.log('Testing getAllUsers() model function...\n');

    const users = await getAllUsers();

    console.log(`Total users: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   is_admin: ${user.is_admin} (type: ${typeof user.is_admin})`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

test();
