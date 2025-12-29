const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PhaseISubmission = require('./src/models/PhaseISubmission');
require('./src/models/Student');
require('./src/models/Faculty');
require('./src/models/User');

(async () => {
  dotenv.config();
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is required. Set it to your MongoDB Atlas connection string.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);

  // Get the latest submission (from test script)
  const sub = await PhaseISubmission.findOne({})
    .sort({ createdAt: -1 })
    .populate('studentId', '_id rollNumber')
    .populate('mentorId', '_id employeeId userId')
    .populate('innovationCoordinatorId', '_id employeeId userId')
    .lean();

  if (!sub) {
    console.log('No submission found');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('\n=== SUBMISSION DETAILS ===\n');
  console.log('Submission ID:', sub._id);
  console.log('Student Roll:', sub.studentId?.rollNumber || 'N/A');
  console.log('Event:', sub.eventDetails?.eventName || 'N/A');
  console.log('\n=== APPROVERS ===\n');
  console.log('Mentor / Class Advisor (Faculty):');
  console.log('  - Faculty ID:', sub.mentorId?._id);
  console.log('  - Employee ID:', sub.mentorId?.employeeId);
  console.log('  - User ID:', sub.mentorId?.userId);
  console.log('\nInnovation Coordinator (Faculty):');
  console.log('  - Faculty ID:', sub.innovationCoordinatorId?._id);
  console.log('  - Employee ID:', sub.innovationCoordinatorId?.employeeId);
  console.log('  - User ID:', sub.innovationCoordinatorId?.userId);

  // Get HOD of CSE
  const Department = require('./src/models/Department');
  const Dept = await Department.findOne({ code: 'CSE' }).lean();
  if (Dept?.hodId) {
    const User = require('./src/models/User');
    const hodUser = await User.findById(Dept.hodId).lean();
    console.log('\nHOD (Head of Department):');
    console.log('  - User ID:', hodUser?._id);
    console.log('  - Email:', hodUser?.email);
    console.log('  - Name:', hodUser?.firstName + ' ' + hodUser?.lastName);
  }

  console.log('\n=== LOGIN CREDENTIALS FOR TESTING ===\n');
  console.log('Class Advisor:');
  console.log('  - Email: advisor email (check below)');
  console.log('  - Password: Password123');
  console.log('\nInnovation Coordinator:');
  console.log('  - Email: mentor email (check below)');
  console.log('  - Password: Password123');

  // Get faculty user details
  const User = require('./src/models/User');
  const mentorUser = await User.findById(sub.mentorId?.userId).lean();
  const coordUser = await User.findById(sub.innovationCoordinatorId?.userId).lean();
  
  console.log('\n=== FACULTY EMAILS ===\n');
  console.log('Mentor / Class Advisor Email:', mentorUser?.email);
  console.log('Innovation Coordinator Email:', coordUser?.email);

  await mongoose.disconnect();
})();
