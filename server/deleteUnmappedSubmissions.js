const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/student-participation-tracker');

const PhaseISubmission = require('./src/models/PhaseISubmission');
const Student = require('./src/models/Student');

async function deleteUnmappedSubmissions() {
  try {
    console.log('Finding all Phase I submissions...');
    const allSubmissions = await PhaseISubmission.find({}).lean();
    console.log(`Total submissions found: ${allSubmissions.length}`);
    
    const unmappedSubmissions = [];
    
    for (const submission of allSubmissions) {
      // Check if student exists
      const student = await Student.findById(submission.studentId);
      
      if (!student) {
        unmappedSubmissions.push(submission._id);
        console.log(`❌ Submission ${submission._id} - Student ID ${submission.studentId} NOT FOUND`);
      } else {
        console.log(`✓ Submission ${submission._id} - Student ${student.rollNumber} EXISTS`);
      }
    }
    
    if (unmappedSubmissions.length === 0) {
      console.log('\n✅ All submissions are properly mapped to students!');
    } else {
      console.log(`\n⚠️  Found ${unmappedSubmissions.length} unmapped submissions`);
      console.log('Deleting unmapped submissions...');
      
      const result = await PhaseISubmission.deleteMany({
        _id: { $in: unmappedSubmissions }
      });
      
      console.log(`✅ Deleted ${result.deletedCount} unmapped submissions`);
    }
    
    // Verify remaining submissions
    const remainingCount = await PhaseISubmission.countDocuments();
    console.log(`\n📊 Remaining submissions: ${remainingCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

deleteUnmappedSubmissions();
