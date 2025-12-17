const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import models
const PhaseISubmission = require('./src/models/PhaseISubmission');
const Student = require('./src/models/Student');
const User = require('./src/models/User');
const Faculty = require('./src/models/Faculty');

async function getSubmissionDetails() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-participation-tracker');

    console.log('\n=== FETCHING LATEST SUBMISSION ===\n');

    // Get the latest submission
    const submission = await PhaseISubmission.findOne()
      .sort({ createdAt: -1 })
      .populate({
        path: 'studentId',
        select: 'firstName lastName rollNumber userId',
        populate: { path: 'userId', select: 'email' }
      })
      .populate({
        path: 'mentorId',
        select: 'firstName lastName employeeId userId',
        populate: { path: 'userId', select: 'email' }
      })
      .populate({
        path: 'innovationCoordinatorId',
        select: 'firstName lastName employeeId userId',
        populate: { path: 'userId', select: 'email' }
      })
      .populate({
        path: 'hodId',
        select: 'firstName lastName employeeId userId',
        populate: { path: 'userId', select: 'email' }
      });

    if (!submission) {
      console.log('No submissions found in database');
      await mongoose.connection.close();
      return;
    }

    console.log('Submission ID:', submission._id);
    console.log('Student:', submission.studentId?.firstName, submission.studentId?.lastName, '-', submission.studentId?.rollNumber);
    console.log('Student Email:', submission.studentId?.userId?.email);
    console.log('\n=== APPROVAL CHAIN ===\n');

    // Mentor details
    if (submission.mentorId) {
      console.log('✓ MENTOR (Faculty ID):', submission.mentorId._id);
      console.log('  Name:', submission.mentorId.firstName, submission.mentorId.lastName);
      console.log('  Employee ID:', submission.mentorId.employeeId);
      console.log('  Email:', submission.mentorId.userId?.email);
      console.log('  Approval Status:', submission.mentorApproval?.approved ? 'APPROVED' : 'PENDING');
    }

    // Get Student's Advisor
    const student = await Student.findById(submission.studentId._id).populate({
      path: 'advisorId',
      select: 'firstName lastName employeeId userId',
      populate: { path: 'userId', select: 'email' }
    });

    console.log('\n✓ CLASS ADVISOR (Student\'s Advisor - From Student Record)');
    if (student?.advisorId) {
      console.log('  Faculty ID:', student.advisorId._id);
      console.log('  Name:', student.advisorId.firstName, student.advisorId.lastName);
      console.log('  Employee ID:', student.advisorId.employeeId);
      console.log('  Email:', student.advisorId.userId?.email);
      console.log('  Approval Status:', submission.classAdvisorApproval?.approved ? 'APPROVED' : 'PENDING');
    }

    // Innovation Coordinator details
    console.log('\n✗ INNOVATION COORDINATOR (innovationCoordinatorId):', submission.innovationCoordinatorId ? submission.innovationCoordinatorId._id : 'NOT ASSIGNED');
    if (submission.innovationCoordinatorId) {
      console.log('  Name:', submission.innovationCoordinatorId.firstName, submission.innovationCoordinatorId.lastName);
      console.log('  Employee ID:', submission.innovationCoordinatorId.employeeId);
      console.log('  Email:', submission.innovationCoordinatorId.userId?.email);
      console.log('  Approval Status:', submission.innovationCoordinatorApproval?.approved ? 'APPROVED' : 'PENDING');
    }

    // HOD details
    console.log('\n✗ HOD (hodId):', submission.hodId ? submission.hodId._id : 'NOT ASSIGNED');
    if (submission.hodId) {
      console.log('  Name:', submission.hodId.firstName, submission.hodId.lastName);
      console.log('  Employee ID:', submission.hodId.employeeId);
      console.log('  Email:', submission.hodId.userId?.email);
      console.log('  Approval Status:', submission.hodApproval?.approved ? 'APPROVED' : 'PENDING');
    }

    console.log('\n=== CURRENT APPROVAL STAGE ===');
    console.log('Current Stage:', submission.currentApprovalStage);

    console.log('\n=== SUMMARY FOR TESTING ===');
    console.log('\nTo test the approval workflow:');
    console.log('\n1. MENTOR (Currently showing submissions):');
    console.log('   Email:', submission.mentorId?.userId?.email);
    console.log('   ID:', submission.mentorId?._id);
    
    if (student?.advisorId) {
      console.log('\n2. CLASS ADVISOR (needs to approve next):');
      console.log('   Email:', student.advisorId.userId?.email);
      console.log('   ID:', student.advisorId._id);
    }
    
    if (submission.innovationCoordinatorId) {
      console.log('\n3. INNOVATION COORDINATOR (needs to approve next):');
      console.log('   Email:', submission.innovationCoordinatorId.userId?.email);
      console.log('   ID:', submission.innovationCoordinatorId._id);
    } else {
      console.log('\n3. INNOVATION COORDINATOR: NOT ASSIGNED - Need to assign one');
    }
    
    if (submission.hodId) {
      console.log('\n4. HOD (Final approval):');
      console.log('   Email:', submission.hodId.userId?.email);
      console.log('   ID:', submission.hodId._id);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

getSubmissionDetails();
