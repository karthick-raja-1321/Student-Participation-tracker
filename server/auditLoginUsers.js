const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get sample users from each role
    const superAdmin = await User.findOne({ role: 'SUPER_ADMIN' });
    const hods = await User.find({ role: 'HOD' }).limit(2);
    const faculties = await User.find({ role: 'FACULTY' }).limit(3);
    const students = await User.find({ role: 'STUDENT' }).limit(3);
    
    console.log('\n=== SUPER ADMIN ===');
    if (superAdmin) {
      console.log(`Email: ${superAdmin.email} | Password: Password123 | Active: ${superAdmin.isActive}`);
    } else {
      console.log('No SUPER_ADMIN found');
    }
    
    console.log('\n=== HODs (first 2) ===');
    hods.forEach(hod => {
      console.log(`Email: ${hod.email} | Password: Password123 | Active: ${hod.isActive}`);
    });
    if (hods.length === 0) console.log('No HODs found');
    
    console.log('\n=== FACULTY (first 3) ===');
    faculties.forEach(fac => {
      console.log(`Email: ${fac.email} | Password: Password123 | Active: ${fac.isActive}`);
    });
    if (faculties.length === 0) console.log('No FACULTY found');
    
    console.log('\n=== STUDENTS (first 3) ===');
    students.forEach(std => {
      console.log(`Email: ${std.email} | Password: Password123 | Active: ${std.isActive}`);
    });
    if (students.length === 0) console.log('No STUDENTS found');
    
    // Check total counts
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: 'SUPER_ADMIN' });
    const hodCount = await User.countDocuments({ role: 'HOD' });
    const facCount = await User.countDocuments({ role: 'FACULTY' });
    const stdCount = await User.countDocuments({ role: 'STUDENT' });
    
    console.log('\n=== TOTALS ===');
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Admins: ${adminCount}, HODs: ${hodCount}, Faculty: ${facCount}, Students: ${stdCount}`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
