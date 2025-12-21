require('dotenv').config();
const mongoose = require('mongoose');
const Faculty = require('./src/models/Faculty');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('\n===== FIXING FACULTY ROLES =====\n');
    
    // Get all faculty
    const faculties = await Faculty.find();
    
    console.log(`Found ${faculties.length} faculty. Updating roles...\n`);
    
    // Assign roles to all faculty:
    // - Every faculty is a Mentor
    // - Every first faculty in dept is ClassAdvisor
    // - Every first faculty in CSE is InnovationCoordinator
    
    let updated = 0;
    const deptFirstFacultyMap = {};
    
    for (const fac of faculties) {
      let changes = false;
      
      // Make all faculty mentors
      if (!fac.isMentor) {
        fac.isMentor = true;
        changes = true;
      }
      
      // Make first faculty per department a class advisor
      const deptId = fac.departmentId.toString();
      if (!deptFirstFacultyMap[deptId]) {
        if (!fac.isClassAdvisor) {
          fac.isClassAdvisor = true;
          changes = true;
        }
        deptFirstFacultyMap[deptId] = true;
      }
      
      // Make first faculty in CSE an innovation coordinator
      if (deptId === '6947afccb30cfe20378a2349' && !fac.isInnovationCoordinator) {
        // CSE dept ID from audit
        fac.isInnovationCoordinator = true;
        changes = true;
      }
      
      if (changes) {
        await fac.save();
        updated++;
        const roles = [];
        if (fac.isClassAdvisor) roles.push('ClassAdvisor');
        if (fac.isMentor) roles.push('Mentor');
        if (fac.isInnovationCoordinator) roles.push('IC');
        console.log(`  Updated ${fac.employeeId}: ${roles.join(' + ')}`);
      }
    }
    
    console.log(`\nUpdated ${updated} faculty records.\n`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
