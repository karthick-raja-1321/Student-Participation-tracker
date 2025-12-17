const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./src/models/User');
const Faculty = require('./src/models/Faculty');
const Student = require('./src/models/Student');
const Department = require('./src/models/Department');
const Event = require('./src/models/Event');
const EventRegistration = require('./src/models/EventRegistration');
const PhaseISubmission = require('./src/models/PhaseISubmission');
const EventView = require('./src/models/EventView');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-participation-tracker');
    console.log('✓ Connected to MongoDB');
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
}

async function testWorkflow() {
  try {
    console.log('\n========================================');
    console.log('COMPLETE WORKFLOW TEST');
    console.log('========================================\n');

    // Step 1: Get Faculty1, Faculty2, HOD, and Student
    console.log('STEP 1: Getting Faculty and Student Data');
    console.log('----------------------------------------');

    const faculty1 = await Faculty.findOne({ employeeId: 'FAC2000' }).populate('userId departmentId');
    const faculty2 = await Faculty.findOne({ employeeId: 'FAC2001' }).populate('userId departmentId');
    
    if (!faculty1 || !faculty2) {
      console.error('✗ Faculty members not found');
      return;
    }
    console.log(`✓ Faculty1 (Advisor): ${faculty1.employeeId}`);
    console.log(`✓ Faculty2 (Mentor): ${faculty2.employeeId}`);

    const student = await Student.findOne({ year: 1, section: 'A' }).populate('userId departmentId advisorId mentorId');
    if (!student) {
      console.error('✗ Student not found');
      return;
    }
    console.log(`✓ Student: ${student._id} (Year ${student.year}, Section ${student.section})`);
    console.log(`  - Advisor: ${student.advisorId?.employeeId || 'Not assigned'}`);
    console.log(`  - Mentor: ${student.mentorId?.employeeId || 'Not assigned'}`);

    const hodUser = await User.findOne({ role: 'HOD', departmentId: student.departmentId._id });
    let hod = hodUser ? await Faculty.findOne({ userId: hodUser._id }).populate('userId departmentId') : null;
    
    // Use Faculty1 as HOD for this test if HOD doesn't exist
    if (!hod) {
      console.log(`⚠ HOD not found for department. Using Faculty1 as HOD for testing purposes.`);
      hod = faculty1;
    } else {
      console.log(`✓ HOD: ${hod.employeeId} (Department: ${hod.departmentId.name})`);
    }

    // Step 2: Create Event using Faculty1
    console.log('\n\nSTEP 2: Creating Event (by Faculty1)');
    console.log('----------------------------------------');

    const event = await Event.create({
      title: 'Test Event - Workflow Testing',
      description: 'Complete workflow test event',
      eventType: 'WORKSHOP',
      organizerName: faculty1.userId.firstName + ' ' + faculty1.userId.lastName,
      venue: 'Main Hall',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      createdBy: faculty1.userId._id,
      departmentId: faculty1.departmentId._id,
      isPublished: true
    });
    console.log(`✓ Event created: ${event.title} (ID: ${event._id})`);
    console.log(`  - Event Type: ${event.eventType}`);
    console.log(`  - Organizer: ${event.organizerName}`);

    // Step 3: Check notifications to all faculties
    console.log('\n\nSTEP 3: Checking Event Visibility');
    console.log('----------------------------------------');
    
    const allEvents = await Event.countDocuments({ status: 'PUBLISHED' });
    console.log(`✓ Total published events in system: ${allEvents}`);
    
    const eventInDept = await Event.countDocuments({ 
      status: 'PUBLISHED',
      departmentId: faculty1.departmentId._id
    });
    console.log(`✓ Events in Faculty1's department: ${eventInDept}`);

    // Step 4: Register view by Student and Faculty
    console.log('\n\nSTEP 4: Tracking Event Views');
    console.log('----------------------------------------');

    await EventView.create({
      eventId: event._id,
      userId: student.userId,
      userType: 'STUDENT',
      studentId: student._id
    });
    console.log(`✓ View tracked: Student (ID: ${student._id})`);

    await EventView.create({
      eventId: event._id,
      userId: faculty2.userId,
      userType: 'FACULTY',
      facultyId: faculty2._id
    });
    console.log(`✓ View tracked: Faculty ${faculty2.employeeId}`);

    const viewCount = await EventView.countDocuments({ eventId: event._id });
    console.log(`✓ Total views for event: ${viewCount}`);

    // Step 5: Student registers for event
    console.log('\n\nSTEP 5: Student Registration for Event');
    console.log('----------------------------------------');

    const registration = await EventRegistration.findOneAndUpdate(
      { eventId: event._id, studentId: student._id },
      {
        eventId: event._id,
        studentId: student._id,
        participationType: 'INDIVIDUAL',
        paymentStatus: 'PENDING',
        paymentAmount: 0,
        registeredAt: new Date()
      },
      { upsert: true, new: true }
    );
    console.log(`✓ Registration created/updated: ${student.registerNumber}`);
    console.log(`  - Participation Type: ${registration.participationType}`);
    console.log(`  - Payment Status: ${registration.paymentStatus}`);

    // Step 6: Create Phase I Submission
    console.log('\n\nSTEP 6: Creating Phase I Submission');
    console.log('----------------------------------------');

    const phaseISubmission = await PhaseISubmission.create({
      registrationId: registration._id,
      studentId: student._id,
      eventId: event._id,
      eventDetails: {
        eventName: event.title,
        venue: event.venue,
        startDate: event.startDate,
        endDate: event.endDate,
        organizerName: faculty1.userId.firstName + ' ' + faculty1.userId.lastName
      },
      advisorId: student.advisorId,
      mentorId: student.mentorId,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      isDraft: false
    });
    console.log(`✓ Phase I Submission created (ID: ${phaseISubmission._id})`);
    console.log(`  - Student: ${student.registerNumber}`);
    console.log(`  - Event: ${event.title}`);
    console.log(`  - Status: ${phaseISubmission.status}`);

    // Step 7: Check submission visibility
    console.log('\n\nSTEP 7: Checking Submission Visibility');
    console.log('----------------------------------------');

    // For Class Advisor (Faculty1)
    const advisorSubmissions = await PhaseISubmission.find({
      advisorId: faculty1._id
    }).populate('studentId eventId');
    console.log(`✓ Advisor View: ${faculty1.employeeId} sees ${advisorSubmissions.length} submission(s)`);

    // For Mentor/Innovation Coordinator (Faculty2)
    const mentorSubmissions = await PhaseISubmission.find({
      mentorId: faculty2._id
    }).populate('studentId eventId');
    console.log(`✓ Mentor View: ${faculty2.employeeId} sees ${mentorSubmissions.length} submission(s)`);

    // For HOD
    const studentIds = await Student.find({ departmentId: hod.departmentId._id }).select('_id').lean();
    const hodSubmissions = await PhaseISubmission.find({
      studentId: { $in: studentIds.map(s => s._id) }
    }).populate('studentId eventId');
    console.log(`✓ HOD View: ${hod.employeeId} sees ${hodSubmissions.length} submission(s) from department`);

    // Step 8: Advisor Approval
    console.log('\n\nSTEP 8: Advisor Approval');
    console.log('----------------------------------------');

    const updatedByAdvisor = await PhaseISubmission.findByIdAndUpdate(
      phaseISubmission._id,
      {
        'advisorApproval.approved': true,
        'advisorApproval.approvedAt': new Date(),
        'advisorApproval.comments': 'Looks good. Approved by advisor.'
      },
      { new: true }
    );
    console.log(`✓ Advisor Approved`);
    console.log(`  - Advisor: ${student.advisorId.employeeId}`);
    console.log(`  - Comments: ${updatedByAdvisor.advisorApproval.comments}`);

    // Step 9: Mentor Approval
    console.log('\n\nSTEP 9: Mentor Approval');
    console.log('----------------------------------------');

    const updatedByMentor = await PhaseISubmission.findByIdAndUpdate(
      phaseISubmission._id,
      {
        'mentorApproval.approved': true,
        'mentorApproval.approvedAt': new Date(),
        'mentorApproval.comments': 'Excellent submission. Approved by mentor.'
      },
      { new: true }
    );
    console.log(`✓ Mentor Approved`);
    console.log(`  - Mentor: ${student.mentorId.employeeId}`);
    console.log(`  - Comments: ${updatedByMentor.mentorApproval.comments}`);

    // Step 10: HOD Approval
    console.log('\n\nSTEP 10: HOD Final Approval');
    console.log('----------------------------------------');

    const finalSubmission = await PhaseISubmission.findByIdAndUpdate(
      phaseISubmission._id,
      {
        'hodApproval.approved': true,
        'hodApproval.approvedAt': new Date(),
        'hodApproval.comments': 'All approvals verified. Final approval granted.',
        status: 'APPROVED'
      },
      { new: true }
    );
    console.log(`✓ HOD Final Approval`);
    console.log(`  - HOD: ${hod.employeeId}`);
    console.log(`  - Comments: ${finalSubmission.hodApproval.comments}`);
    console.log(`  - Submission Status: ${finalSubmission.status}`);

    // Step 11: Final Verification
    console.log('\n\nSTEP 11: Final Verification - All Views Can See Updated Status');
    console.log('----------------------------------------------------------------');

    const finalCheck = await PhaseISubmission.findById(phaseISubmission._id)
      .populate('studentId advisorId mentorId eventId');

    console.log(`✓ Submission ID: ${finalCheck._id}`);
    console.log(`✓ Student: ${finalCheck.studentId.registerNumber}`);
    console.log(`✓ Event: ${finalCheck.eventId.title}`);
    console.log(`\n  Approval Chain:`);
    console.log(`    1. Advisor (${finalCheck.advisorId.employeeId}): ${finalCheck.advisorApproval.approved === true ? '✓ APPROVED' : '✗ PENDING'}`);
    console.log(`    2. Mentor (${finalCheck.mentorId.employeeId}): ${finalCheck.mentorApproval.approved === true ? '✓ APPROVED' : '✗ PENDING'}`);
    console.log(`    3. HOD (${hod.employeeId}): ${finalCheck.hodApproval.approved === true ? '✓ APPROVED' : '✗ PENDING'}`);
    console.log(`\n  Final Status: ${finalCheck.status}`);

    console.log('\n========================================');
    console.log('✓ WORKFLOW TEST COMPLETED SUCCESSFULLY');
    console.log('========================================\n');

  } catch (error) {
    console.error('✗ Error during workflow test:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
  }
}

connectDB().then(() => testWorkflow());
