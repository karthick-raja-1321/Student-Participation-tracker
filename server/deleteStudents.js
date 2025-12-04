const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./src/models/Student');
const User = require('./src/models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const rollNumbers = ['24CS141', '24CS143'];
    const students = await Student.find({ 
      rollNumber: { $in: rollNumbers } 
    }).populate('userId');
    
    console.log(`Found ${students.length} students to delete`);
    
    for (const student of students) {
      console.log(`\nDeleting student: ${student.rollNumber}`);
      
      if (student.userId) {
        await User.findByIdAndDelete(student.userId._id);
        console.log(`  - Deleted user: ${student.userId.email}`);
      }
      
      await Student.findByIdAndDelete(student._id);
      console.log(`  - Deleted student record`);
    }
    
    console.log('\n✓ Deletion complete');
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
