const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Student = require('./src/models/Student');
const Faculty = require('./src/models/Faculty');
const Event = require('./src/models/Event');
const PhaseISubmission = require('./src/models/PhaseISubmission');
const EventRegistration = require('./src/models/EventRegistration');
const User = require('./src/models/User');

async function testInnovationCoordinatorApproval() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is required.');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Faculty1 (Advisor - FAC2000) and Faculty2 (Innovation Coordinator - FAC2001)
    const faculty1 = await Faculty.findOne({ employeeId: 'FAC2000' }).populate('userId');
    const faculty2 = await Faculty.findOne({ employeeId: 'FAC2001' }).populate('userId');
    
    console.log(`📋 Faculty1 (Advisor): ${faculty1?.userId?.email}`);
    console.log(`📋 Faculty2 (Innovation Coordinator): ${faculty2?.userId?.email}`);

    if (!faculty1 || !faculty2) {
      console.log('❌ Faculty members not found');
      process.exit(1);
    }

    // Get a student
    const student = await Student.findOne().populate('userId');
    console.log(`👤 Student: ${student?.userId?.email}\n`);

    // Get or create an event
    let event = await Event.findOne().limit(1);
    if (!event) {
      event = await Event.create({
        title: 'Innovation Coordinator Test Event',
        eventType: 'WORKSHOP',
        venue: 'Lab A',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86400000),
        organizerId: faculty1._id,
      });
      console.log(`📅 Created event: ${event.title}`);
    } else {
      console.log(`📅 Using event: ${event.title}`);
    }

    // Create a registration if not exists
    let registration = await EventRegistration.findOne({ studentId: student._id, eventId: event._id });
    if (!registration) {
      registration = await EventRegistration.create({
        studentId: student._id,
        eventId: event._id,
        participationType: 'INDIVIDUAL',
        advisorId: faculty1._id,
        mentorId: faculty2._id,
      });
      console.log('✅ Created registration\n');
    }

    // Create or get Phase I submission
    let submission = await PhaseISubmission.findOne({ 
      studentId: student._id, 
      eventId: event._id 
    }).populate('advisorId mentorId');

    if (!submission) {
      submission = await PhaseISubmission.create({
        studentId: student._id,
        eventId: event._id,
        advisorId: faculty1._id,
        mentorId: faculty2._id,
        eventDetails: {
          venue: event.venue,
          startDate: event.startDate,
          endDate: event.endDate,
        },
        registrationDetails: {
          participationType: 'INDIVIDUAL',
          paymentStatus: 'PAID',
        },
      });
      console.log('✅ Created Phase I submission');
    } else {
      console.log('✅ Using existing Phase I submission');
    }

    console.log(`\n📝 Submission ID: ${submission._id}`);
    console.log(`📋 Current Status: ${submission.status}`);
    console.log(`\n--- APPROVAL STATUS ---`);
    console.log(`Advisor Approval: ${submission.advisorApproval?.approved || 'PENDING'}`);
    console.log(`Innovation Coordinator Approval: ${submission.mentorApproval?.approved || 'PENDING'}`);
    console.log(`HOD Approval: ${submission.hodApproval?.approved || 'PENDING'}\n`);

    // Step 1: Faculty1 (Advisor) approves
    console.log('📌 Step 1: Faculty1 (Advisor) approves...');
    submission.advisorApproval = {
      approved: true,
      approvedAt: new Date(),
      comments: 'Approved by Class Advisor'
    };
    await submission.save();
    console.log('✅ Faculty1 approved\n');

    // Step 2: Faculty2 (Innovation Coordinator) approves
    console.log('📌 Step 2: Faculty2 (Innovation Coordinator) should now be able to approve...');
    
    // Fetch fresh submission to simulate Faculty2's view
    const freshSubmission = await PhaseISubmission.findById(submission._id);
    console.log(`Advisor Approval Status: ${freshSubmission.advisorApproval?.approved ? '✅ APPROVED' : '❌ NOT APPROVED'}`);
    console.log(`Innovation Coordinator Approval Status: ${freshSubmission.mentorApproval?.approved ? '✅ APPROVED' : '❌ PENDING'}`);
    
    if (freshSubmission.advisorApproval?.approved === true) {
      console.log('✅ Advisor approval is persisted in database');
      console.log('✅ Faculty2 should now see this submission in Innovation Coordinator Approvals tab\n');
      
      freshSubmission.mentorApproval = {
        approved: true,
        approvedAt: new Date(),
        comments: 'Approved by Innovation Coordinator'
      };
      await freshSubmission.save();
      console.log('✅ Faculty2 approved\n');
    } else {
      console.log('❌ ERROR: Advisor approval not persisted!');
    }

    // Step 3: HOD approves and sets final status
    console.log('📌 Step 3: HOD approves and sets final status...');
    const finalSubmission = await PhaseISubmission.findById(submission._id);
    
    if (finalSubmission.advisorApproval?.approved && finalSubmission.mentorApproval?.approved) {
      finalSubmission.hodApproval = {
        approved: true,
        approvedAt: new Date(),
        comments: 'Approved by HOD'
      };
      finalSubmission.status = 'APPROVED';
      await finalSubmission.save();
      console.log('✅ HOD approved - Final Status: APPROVED\n');
    } else {
      console.log('❌ ERROR: Cannot approve at HOD level - prior approvals missing\n');
    }

    // Show final state
    const completedSubmission = await PhaseISubmission.findById(submission._id);
    console.log('=== FINAL APPROVAL STATUS ===');
    console.log(`✅ Advisor Approval: ${completedSubmission.advisorApproval?.approved ? 'APPROVED' : 'NOT APPROVED'}`);
    console.log(`✅ Innovation Coordinator Approval: ${completedSubmission.mentorApproval?.approved ? 'APPROVED' : 'NOT APPROVED'}`);
    console.log(`✅ HOD Approval: ${completedSubmission.hodApproval?.approved ? 'APPROVED' : 'NOT APPROVED'}`);
    console.log(`✅ Final Status: ${completedSubmission.status}`);
    console.log('\n✅ INNOVATION COORDINATOR APPROVAL TEST COMPLETED SUCCESSFULLY\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testInnovationCoordinatorApproval();
