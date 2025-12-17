const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Faculty = require('./src/models/Faculty');
const Department = require('./src/models/Department');

(async () => {
  dotenv.config();
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-participation-tracker');

  const email = 'student.cse1@sece.ac.in';
  const rollNumber = 'CSE001';
  const dept = await Department.findOne({ code: 'CSE' });
  const advisor = await Faculty.findOne({ employeeId: 'FAC2000' });
  const mentor = await Faculty.findOne({ employeeId: 'FAC2001' });

  if (!dept || !advisor || !mentor) {
    console.error('Missing dept/advisor/mentor');
    process.exit(1);
  }

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      email,
      password: 'Password123',
      role: 'STUDENT',
      firstName: 'Test',
      lastName: 'Student',
      departmentId: dept._id,
    });
    console.log('Created user', user.email);
  } else {
    console.log('User exists', user.email);
  }

  let student = await Student.findOne({ userId: user._id });
  if (!student) {
    student = await Student.create({
      userId: user._id,
      rollNumber,
      departmentId: dept._id,
      year: 1,
      section: 'A',
      advisorId: advisor._id,
      mentorId: mentor._id,
      phone: '9000000001',
      cgpa: 8.5,
    });
    console.log('Created student', student.rollNumber);
  } else {
    console.log('Student exists', student.rollNumber);
  }

  const populated = await Student.findById(student._id).populate('userId departmentId advisorId mentorId').lean();
  console.log('Student profile:', populated);

  await mongoose.disconnect();
})();
