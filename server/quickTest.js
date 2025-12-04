const http = require('http');

console.log('\n🧪 QUICK ON-DUTY APPROVAL TEST\n');

// Test 1: Check if server is responding
http.get('http://localhost:5000/api/health', (res) => {
  console.log('✅ Server is running on port 5000');
  console.log('Status: ' + res.statusCode + '\n');
  
  // Test 2: Try to login
  const axios = require('axios');
  
  axios.post('http://localhost:5000/api/auth/login', {
    email: 'hod.cse@sece.ac.in',
    password: 'Password123'
  })
  .then(res => {
    console.log('✅ HOD Login successful');
    console.log('Token: ' + res.data.data.token.substring(0, 40) + '...\n');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ Login failed: ' + (err.response?.data?.message || err.message));
    process.exit(1);
  });
}).on('error', (err) => {
  console.log('❌ Server not running: ' + err.message);
  process.exit(1);
});
