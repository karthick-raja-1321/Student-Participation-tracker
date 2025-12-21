const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const User = require('./src/models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');
    
    // Fetch all faculty and students
    const allFaculty = await User.find({ role: 'FACULTY' });
    const allStudents = await User.find({ role: 'STUDENT' });
    
    console.log(`Found ${allFaculty.length} Faculty and ${allStudents.length} Students\n`);
    
    const apiUrl = 'https://student-participation-tracker.onrender.com/api/auth/login';
    let successCount = 0;
    let failCount = 0;
    const failures = [];
    
    // Test all faculty
    console.log('=== TESTING ALL FACULTY ===\n');
    for (const faculty of allFaculty) {
      try {
        const response = await axios.post(apiUrl, {
          email: faculty.email,
          password: 'Password123'
        }, { timeout: 10000 });
        
        if (response.status === 200) {
          console.log(`✓ ${faculty.email}`);
          successCount++;
        } else {
          console.log(`✗ ${faculty.email} - Status ${response.status}`);
          failCount++;
          failures.push(faculty.email);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.log(`✗ ${faculty.email} - ${errorMsg}`);
        failCount++;
        failures.push(faculty.email);
      }
    }
    
    // Test all students
    console.log('\n=== TESTING ALL STUDENTS ===\n');
    for (const student of allStudents) {
      try {
        const response = await axios.post(apiUrl, {
          email: student.email,
          password: 'Password123'
        }, { timeout: 10000 });
        
        if (response.status === 200) {
          console.log(`✓ ${student.email}`);
          successCount++;
        } else {
          console.log(`✗ ${student.email} - Status ${response.status}`);
          failCount++;
          failures.push(student.email);
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.log(`✗ ${student.email} - ${errorMsg}`);
        failCount++;
        failures.push(student.email);
      }
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Failed: ${failCount}`);
    
    if (failures.length > 0) {
      console.log('\nFailed Logins:');
      failures.forEach(email => console.log(`  - ${email}`));
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
