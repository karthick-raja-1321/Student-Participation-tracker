const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/student-participation-tracker');

const PhaseISubmission = require('./src/models/PhaseISubmission');
const Faculty = require('./src/models/Faculty');
const Event = require('./src/models/Event');
const Student = require('./src/models/Student');

async function cleanupSubmissions() {
  try {
    console.log('Analyzing all Phase I submissions...\n');
    const allSubmissions = await PhaseISubmission.find({})
      .populate('studentId', 'rollNumber')
      .lean();
    
    console.log(`Total submissions: ${allSubmissions.length}\n`);
    
    const toDelete = [];
    
    for (const submission of allSubmissions) {
      const issues = [];
      
      // Check student
      if (!submission.studentId) {
        issues.push('Missing student');
      }
      
      // Check mentor
      if (submission.mentorId) {
        const mentor = await Faculty.findById(submission.mentorId);
        if (!mentor) {
          issues.push('Invalid mentor ID');
        }
      } else {
        issues.push('Missing mentor');
      }
      
      // Check event
      if (submission.eventId) {
        const event = await Event.findById(submission.eventId);
        if (!event) {
          issues.push('Invalid event ID');
        }
      } else {
        issues.push('Missing event');
      }
      
      if (issues.length > 0) {
        console.log(`❌ Submission ${submission._id}`);
        console.log(`   Student: ${submission.studentId?.rollNumber || 'N/A'}`);
        console.log(`   Issues: ${issues.join(', ')}`);
        console.log(`   Stage: ${submission.currentApprovalStage}`);
        console.log('');
        toDelete.push(submission._id);
      } else {
        console.log(`✓ Submission ${submission._id} - Student: ${submission.studentId.rollNumber} - Valid`);
      }
    }
    
    if (toDelete.length > 0) {
      console.log(`\n⚠️  Found ${toDelete.length} problematic submissions`);
      console.log('Do you want to delete them? (This script will delete them now)');
      
      const result = await PhaseISubmission.deleteMany({
        _id: { $in: toDelete }
      });
      
      console.log(`\n✅ Deleted ${result.deletedCount} problematic submissions`);
    } else {
      console.log('\n✅ All submissions are valid!');
    }
    
    // Show summary
    const remainingCount = await PhaseISubmission.countDocuments();
    console.log(`\n📊 Final count: ${remainingCount} submissions`);
    
    // Group by student
    const byStudent = await PhaseISubmission.aggregate([
      {
        $group: {
          _id: '$studentId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $project: {
          rollNumber: '$student.rollNumber',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
    
    console.log('\n📊 Submissions by student:');
    byStudent.forEach(item => {
      console.log(`   ${item.rollNumber}: ${item.count} submission(s)`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

cleanupSubmissions();
