const axios = require('axios');

const testFacultyCreation = async () => {
  const apiUrl = 'https://student-participation-tracker.onrender.com/api';
  
  try {
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    const loginRes = await axios.post(`${apiUrl}/auth/login`, {
      email: 'admin@sece.ac.in',
      password: 'Password123'
    });
    
    const token = loginRes.data.data.token;
    console.log('✓ Login successful\n');
    
    // Step 2: Get departments first
    console.log('Step 2: Fetching departments...');
    const deptRes = await axios.get(`${apiUrl}/departments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const cseDepto = deptRes.data.data.departments.find(d => d.code === 'CSE');
    if (!cseDepto) throw new Error('CSE department not found');
    console.log('✓ Found CSE department:', cseDepto._id, '\n');
    
    // Step 3: Try creating faculty
    console.log('Step 3: Creating new faculty manually...');
    const payload = {
      userData: {
        email: 'testfac123@sece.ac.in',
        password: 'TestPass@123',
        firstName: 'Test',
        lastName: 'Faculty',
        phone: '9999999999',
        departmentId: cseDepto._id
      },
      facultyData: {
        employeeId: 'TESTFAC123',
        departmentId: cseDepto._id,
        designation: 'Assistant Professor',
        isClassAdvisor: false,
        advisorForClasses: [],
        isInnovationCoordinator: false,
        innovationCoordinatorFor: []
      }
    };
    
    console.log('Payload being sent:', JSON.stringify(payload, null, 2), '\n');
    
    const createRes = await axios.post(`${apiUrl}/faculty`, payload, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('✓ Faculty created successfully!');
    console.log('Response:', JSON.stringify(createRes.data, null, 2));
    
  } catch (error) {
    console.error('✗ Error:', error.response?.status, error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('\nFull response:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.response?.data?.errors) {
      console.error('\nDetailed errors:');
      error.response.data.errors.forEach(err => console.error('  -', err));
    }
  }
};

testFacultyCreation();
