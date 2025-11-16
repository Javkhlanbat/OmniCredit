require('dotenv').config();

async function testAdminAPI() {
  try {
    console.log('🧪 Testing Admin API...\n');

    // Step 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: '95556339',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(`Login failed: ${JSON.stringify(error)}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('   User:', loginData.user.email);
    console.log('   Is Admin:', loginData.user.is_admin);
    console.log('   Token:', loginData.token.substring(0, 20) + '...');

    if (!loginData.user.is_admin) {
      throw new Error('❌ User is not admin!');
    }

    const token = loginData.token;

    // Step 2: Get all users
    console.log('\n2️⃣ Fetching all users...');
    const usersResponse = await fetch('http://localhost:5000/api/auth/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!usersResponse.ok) {
      const error = await usersResponse.json();
      throw new Error(`Get users failed: ${JSON.stringify(error)}`);
    }

    const usersData = await usersResponse.json();
    console.log('✅ Users loaded successfully!');
    console.log(`   Total users: ${usersData.users.length}`);
    console.log('\n   Users list:');
    usersData.users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.first_name} ${user.last_name} (${user.email}) - Admin: ${user.is_admin || false}`);
    });

    // Step 3: Get all loans
    console.log('\n3️⃣ Fetching all loans...');
    const loansResponse = await fetch('http://localhost:5000/api/loans/admin/all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!loansResponse.ok) {
      const error = await loansResponse.json();
      throw new Error(`Get loans failed: ${JSON.stringify(error)}`);
    }

    const loansData = await loansResponse.json();
    console.log('✅ Loans loaded successfully!');
    console.log(`   Total loans: ${loansData.loans?.length || 0}`);

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAdminAPI();
