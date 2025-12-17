const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/student-participation-tracker');

const PhaseISubmission = require('./src/models/PhaseISubmission');
const Faculty = require('./src/models/Faculty');
const Student = require('./src/models/Student');

async function checkSubmission() {
  try {
    const submissionId = '693ac1177817019c66db823b';
    
    const submission = await PhaseISubmission.findById(submissionId)
      .populate('studentId')
      .populate('mentorId')
      .lean();
    
    if (!submission) {
      console.log('Submission not found!');
      return;
    }
    
    console.log('\n=== SUBMISSION DETAILS ===');
    console.log('ID:', submission._id);
    console.log('Student:', submission.studentId?.rollNumber);
    console.log('Mentor ID:', submission.mentorId?._id);
    console.log('Current Stage:', submission.currentApprovalStage);
    console.log('\n=== APPROVAL STATUS ===');
    console.log('Mentor Approval:', JSON.stringify(submission.mentorApproval, null, 2));
    console.log('Class Advisor Approval:', JSON.stringify(submission.classAdvisorApproval, null, 2));
    
    // Check if faculty13 is the mentor
    const faculty13 = await Faculty.findOne({ employeeId: 'FAC2012' }).populate('userId');
    console.log('\n=== FACULTY13 (FAC2012) ===');
    console.log('Faculty ID:', faculty13._id);
    console.log('Is Mentor:', faculty13.isMentor);
    console.log('Email:', faculty13.userId.email);
    
    console.log('\n=== MENTOR MATCH ===');
    console.log('Submission Mentor ID:', submission.mentorId?._id?.toString());
    console.log('Faculty13 ID:', faculty13._id.toString());
    console.log('Match:', submission.mentorId?._id?.toString() === faculty13._id.toString());
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkSubmission();
