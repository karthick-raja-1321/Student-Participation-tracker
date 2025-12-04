const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected');
    
    // Load all models first
    require('./src/models/User');
    require('./src/models/Department');
    const Student = require('./src/models/Student');
    const Event = require('./src/models/Event');
    const Faculty = require('./src/models/Faculty');
    require('./src/models/EventRegistration');
    const PhaseISubmission = require('./src/models/PhaseISubmission');
    const PhaseIISubmission = require('./src/models/PhaseIISubmission');
    
    // Get a sample student
    const student = await Student.findOne().populate('userId departmentId advisorId mentorId');
    if (!student) {
      console.log('❌ No students found');
      process.exit(1);
    }
    
    // If no mentor/advisor, get one
    let advisor = student.advisorId;
    let mentor = student.mentorId;
    
    if (!advisor) {
      advisor = await Faculty.findOne({ isClassAdvisor: true });
      if (advisor) {
        student.advisorId = advisor._id;
        await student.save();
      }
    }
    
    if (!mentor) {
      mentor = await Faculty.findOne({ isMentor: true });
      if (mentor) {
        student.mentorId = mentor._id;
        await student.save();
      }
    }
    
    // Update student on-duty balance for testing
    student.onDuty = {
      totalAllowed: 7,
      availed: 2,
      balance: 5,
      lastUpdated: new Date()
    };
    await student.save();
    console.log('✓ Student updated - Balance: 2/7 availed, 5 remaining');
    console.log('  Roll Number:', student.rollNumber);
    
    // Get a sample event
    let event = await Event.findOne();
    if (!event) {
      event = await Event.create({
        title: 'On-Duty Test Event',
        eventType: 'Technical',
        description: 'Test event for on-duty approval',
        startDate: new Date(),
        endDate: new Date(Date.now() + 24*60*60*1000),
        location: 'Test Location',
        maxParticipants: 100,
        registrationDeadline: new Date(Date.now() + 12*60*60*1000),
        isPublished: true
      });
      console.log('✓ Event created:', event.title);
    } else {
      console.log('✓ Event found:', event.title);
    }
    
    // Get or create Phase I submission - find existing one
    let phaseI = await PhaseISubmission.findOne({ studentId: student._id });
    if (!phaseI) {
      console.log('❌ No Phase I submission found for this student');
      // Try to get any Phase I submission
      phaseI = await PhaseISubmission.findOne();
      if (!phaseI) {
        console.log('❌ No Phase I submissions in database');
        process.exit(1);
      }
      console.log('✓ Using existing Phase I Submission');
    } else {
      console.log('✓ Phase I Submission found');
    }
    
    // Create or update Phase II submission for on-duty
    
    if (phaseII) {
      phaseII.onDutyApprovalStatus = 'PENDING';
      phaseII.isOnDuty = true;
      await phaseII.save();
      console.log('✓ Phase II On-Duty Submission updated to PENDING');
    } else {
      phaseII = await PhaseIISubmission.create({
        phaseISubmissionId: phaseI._id,
        studentId: student._id,
        eventId: event._id,
        isOnDuty: true,
        onDutyApprovalStatus: 'PENDING',
        status: 'PENDING',
        phaseIIStatus: 'PENDING',
        eventReport: {
          reportText: 'Participated in the on-duty event'
        },
        submittedAt: new Date()
      });
      console.log('✓ Phase II On-Duty Submission created');
    }
    
    console.log('\n📋 SAMPLE DATA READY FOR TESTING:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Student: ' + student.rollNumber);
    console.log('Department: ' + (student.departmentId?.code || 'N/A'));
    console.log('On-Duty Balance: ' + student.onDuty.availed + '/7 availed, ' + student.onDuty.balance + ' remaining');
    console.log('');
    console.log('Event: ' + event.title);
    console.log('');
    console.log('Phase II Submission ID: ' + phaseII._id);
    console.log('Status: ' + phaseII.onDutyApprovalStatus);
    console.log('Is On-Duty: ' + phaseII.isOnDuty);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Data inserted successfully! Ready for testing.');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
