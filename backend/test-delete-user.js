require('dotenv').config();

async function testDeleteUser() {
  try {
    console.log('🧪 Testing Delete User API...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: '95556339',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log(`   Admin: ${loginData.user.email}\n`);

    const token = loginData.token;

    // Step 2: Get all users
    console.log('2️⃣ Getting all users...');
    const usersResponse = await fetch('http://localhost:5000/api/auth/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const usersData = await usersResponse.json();

    console.log(`✅ Found ${usersData.users.length} users:`);
    usersData.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id} - ${user.first_name} ${user.last_name} (${user.email})`);
    });

    // Step 3: Find a test user to delete (not admin)
    const testUser = usersData.users.find(u => !u.is_admin && u.id !== loginData.user.id);

    if (!testUser) {
      console.log('\n⚠️  No non-admin users found to delete');
      return;
    }

    console.log(`\n3️⃣ Attempting to delete user: ${testUser.first_name} ${testUser.last_name} (ID: ${testUser.id})`);

    // Step 4: Delete the user
    const deleteResponse = await fetch(`http://localhost:5000/api/auth/admin/users/${testUser.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      throw new Error(`Delete failed: ${JSON.stringify(error)}`);
    }

    const deleteData = await deleteResponse.json();
    console.log('✅ User deleted successfully!');
    console.log(`   ${JSON.stringify(deleteData, null, 2)}`);

    // Step 5: Verify user is deleted
    console.log('\n4️⃣ Verifying user is deleted...');
    const verifyResponse = await fetch('http://localhost:5000/api/auth/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const verifyData = await verifyResponse.json();

    const deletedUserExists = verifyData.users.find(u => u.id === testUser.id);

    if (deletedUserExists) {
      console.log('❌ User still exists in database!');
    } else {
      console.log(`✅ User successfully removed! Now ${verifyData.users.length} users in database.`);
    }

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testDeleteUser();
