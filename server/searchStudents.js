const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./src/models/Student');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all students and check their advisor/mentor
    const students = await Student.find().limit(5);
    
    console.log('\nFirst 5 students:');
    for (const student of students) {
      console.log({
        id: student._id.toString(),
        rollNumber: student.rollNumber,
        advisorId: student.advisorId ? student.advisorId.toString() : 'NULL',
        mentorId: student.mentorId ? student.mentorId.toString() : 'NULL'
      });
    }
    
    // Count students with/without advisor and mentor
    const total = await Student.countDocuments();
    const withAdvisor = await Student.countDocuments({ advisorId: { $exists: true, $ne: null } });
    const withMentor = await Student.countDocuments({ mentorId: { $exists: true, $ne: null } });
    
    console.log(`\nTotal students: ${total}`);
    console.log(`With advisor: ${withAdvisor}`);
    console.log(`With mentor: ${withMentor}`);
    console.log(`Missing advisor: ${total - withAdvisor}`);
    console.log(`Missing mentor: ${total - withMentor}`);
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
