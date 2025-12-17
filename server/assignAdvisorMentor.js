const mongoose = require('mongoose');
require('dotenv').config();

const Student = require('./src/models/Student');
const Faculty = require('./src/models/Faculty');

async function assignAdvisorMentor() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the first two faculty members to use as advisor and mentor
    const faculties = await Faculty.find().limit(2);
    
    if (faculties.length < 2) {
      console.log('Not enough faculty members. Need at least 2 faculty members.');
      console.log('Creating sample faculty members...');
      
      // Create sample faculty if not exists
      const User = require('./src/models/User');
      const Department = require('./src/models/Department');
      
      const dept = await Department.findOne();
      if (!dept) {
        console.log('No department found. Please create a department first.');
        process.exit(1);
      }
      
      // Create advisor user
      let advisorUser = await User.findOne({ email: 'advisor@example.com' });
      if (!advisorUser) {
        advisorUser = await User.create({
          name: 'Default Advisor',
          email: 'advisor@example.com',
          password: 'password123',
          role: 'FACULTY',
          departmentId: dept._id
        });
      }
      
      // Create mentor user
      let mentorUser = await User.findOne({ email: 'mentor@example.com' });
      if (!mentorUser) {
        mentorUser = await User.create({
          name: 'Default Mentor',
          email: 'mentor@example.com',
          password: 'password123',
          role: 'FACULTY',
          departmentId: dept._id
        });
      }
      
      // Create advisor faculty
      let advisor = await Faculty.findOne({ userId: advisorUser._id });
      if (!advisor) {
        advisor = await Faculty.create({
          userId: advisorUser._id,
          departmentId: dept._id,
          employeeId: 'ADV001',
          designation: 'Assistant Professor'
        });
      }
      
      // Create mentor faculty
      let mentor = await Faculty.findOne({ userId: mentorUser._id });
      if (!mentor) {
        mentor = await Faculty.create({
          userId: mentorUser._id,
          departmentId: dept._id,
          employeeId: 'MEN001',
          designation: 'Assistant Professor'
        });
      }
      
      faculties.push(advisor, mentor);
    }

    const advisor = faculties[0];
    const mentor = faculties[1];

    console.log(`Using advisor: ${advisor.employeeId}`);
    console.log(`Using mentor: ${mentor.employeeId}`);

    // Update all students without advisor/mentor
    const result = await Student.updateMany(
      {
        $or: [
          { advisorId: { $exists: false } },
          { advisorId: null },
          { mentorId: { $exists: false } },
          { mentorId: null }
        ]
      },
      {
        $set: {
          advisorId: advisor._id,
          mentorId: mentor._id
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} students with advisor and mentor`);
    console.log('Assignment completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Assignment failed:', error);
    process.exit(1);
  }
}

assignAdvisorMentor();
