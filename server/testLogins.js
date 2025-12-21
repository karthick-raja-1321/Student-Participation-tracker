const axios = require('axios');

const testLogins = async () => {
  const apiUrl = 'https://student-participation-tracker.onrender.com/api/auth/login';
  
  const credentials = [
    { email: 'admin@sece.ac.in', password: 'Password123', role: 'Admin' },
    { email: 'hod.cse@sece.ac.in', password: 'Password123', role: 'HOD' },
    { email: 'faculty1@sece.ac.in', password: 'Password123', role: 'Faculty' },
    { email: '22csea001@student.sece.ac.in', password: 'Password123', role: 'Student' },
  ];
  
  for (const cred of credentials) {
    try {
      console.log(`\nTesting ${cred.role}: ${cred.email}`);
      const response = await axios.post(apiUrl, {
        email: cred.email,
        password: cred.password
      }, { timeout: 10000 });
      console.log(`✓ Success: ${response.status}`);
    } catch (error) {
      console.log(`✗ Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
  }
};

testLogins();
