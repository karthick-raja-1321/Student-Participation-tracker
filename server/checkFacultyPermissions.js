const mongoose = require('mongoose');
require('dotenv').config();
const { ROLE_PERMISSIONS, ROLES } = require('./src/config/constants');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get faculty1's user record
    const user = await mongoose.connection.collection('users').findOne({ email: 'faculty1@sece.ac.in' });
    console.log('Faculty1 user role:', user?.role);
    
    const facultyPermissions = ROLE_PERMISSIONS[ROLES.FACULTY];
    console.log('\nFaculty permissions:');
    facultyPermissions.forEach(p => console.log('  -', p));
    
    console.log('\nChecking REPORT_VIEW_ASSIGNED permission:');
    console.log('Has REPORT_VIEW_ASSIGNED:', facultyPermissions.includes('report:view:assigned'));
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
