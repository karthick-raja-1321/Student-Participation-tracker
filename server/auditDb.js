require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Department = require('./src/models/Department');
const Faculty = require('./src/models/Faculty');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n===== DATABASE AUDIT =====\n');
    
    // Get all users
    const users = await User.find()
      .select('email role isActive departmentId')
      .populate('departmentId', 'code')
      .lean();
    
    console.log(`\n--- USERS (Total: ${users.length}) ---\n`);
    users.forEach(u => {
      const dept = u.departmentId ? u.departmentId.code : 'N/A';
      console.log(`  ${u.email}`);
      console.log(`    Role: ${u.role} | Active: ${u.isActive} | Dept: ${dept}`);
    });
    
    // Get all faculty and their roles
    const faculties = await Faculty.find()
      .select('employeeId userId isClassAdvisor isMentor isInnovationCoordinator')
      .lean();
    
    console.log(`\n--- FACULTY ROLES (Total: ${faculties.length}) ---\n`);
    faculties.forEach(f => {
      const roles = [];
      if (f.isClassAdvisor) roles.push('ClassAdvisor');
      if (f.isMentor) roles.push('Mentor');
      if (f.isInnovationCoordinator) roles.push('IC');
      const roleStr = roles.length > 0 ? roles.join(' + ') : 'NO_ROLE';
      console.log(`  ${f.employeeId}: ${roleStr}`);
    });
    
    // Count by role
    const roleCounts = {};
    users.forEach(u => {
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    });
    
    console.log(`\n--- USER COUNT BY ROLE ---\n`);
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
