const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get first 2 active faculties
    const faculties = await mongoose.connection.collection('faculties').find({ isActive: true }).limit(2).toArray();
    
    console.log('Available Faculty Credentials:');
    for (let i = 0; i < faculties.length; i++) {
      const faculty = faculties[i];
      const user = await mongoose.connection.collection('users').findOne({ _id: faculty.userId });
      if (user) {
        console.log(`\nFaculty ${i+1}:`);
        console.log('Email:', user.email);
        console.log('Password: Password123 (default)');
        console.log('Name:', user.firstName + ' ' + user.lastName);
        console.log('Faculty ID:', faculty._id.toString());
      }
    }
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
