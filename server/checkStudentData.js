const mongoose = require('mongoose');
require('dotenv').config();

async function checkStudent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Student = require('./src/models/Student');
    
    // Find a student and show their advisor/mentor status
    const student = await Student.findOne()
      .populate('advisorId', 'employeeId name')
      .populate('mentorId', 'employeeId name');
    
    if (student) {
      console.log('\nStudent found:');
      console.log('Roll Number:', student.rollNumber);
      console.log('Advisor ID (raw):', student.advisorId);
      console.log('Mentor ID (raw):', student.mentorId);
      
      // Count students with advisor/mentor
      const withAdvisor = await Student.countDocuments({ advisorId: { $exists: true, $ne: null } });
      const withMentor = await Student.countDocuments({ mentorId: { $exists: true, $ne: null } });
      const total = await Student.countDocuments();
      
      console.log(`\nStudents with advisor: ${withAdvisor}/${total}`);
      console.log(`Students with mentor: ${withMentor}/${total}`);
    } else {
      console.log('No students found');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkStudent();
