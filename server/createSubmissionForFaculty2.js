const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const PhaseISubmission = require('./src/models/PhaseISubmission');
const EventRegistration = require('./src/models/EventRegistration');
const Student = require('./src/models/Student');
const Event = require('./src/models/Event');
const Faculty = require('./src/models/Faculty');

async function createProperSubmission() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-participation-tracker');

    console.log('\n=== CREATING SUBMISSION FOR FACULTY2@SECE.AC.IN (FAC2001) ===\n');

    // Find FAC2001 (faculty2@sece.ac.in)
    const mentorFaculty = await Faculty.findOne({ employeeId: 'FAC2001' });
    if (!mentorFaculty) {
      console.log('ERROR: FAC2001 not found');
      await mongoose.connection.close();
      return;
    }

    console.log('✓ Found Mentor: FAC2001');
    console.log('  Faculty ID:', mentorFaculty._id);
    console.log('  Email: faculty2@sece.ac.in');

    // Find the test student CSE001
    const student = await Student.findOne({ rollNumber: 'CSE001' });
    if (!student) {
      console.log('ERROR: Student CSE001 not found');
      await mongoose.connection.close();
      return;
    }

    console.log('\n✓ Found Student: CSE001');
    console.log('  Student ID:', student._id);

    // Find an event
    const event = await Event.findOne().select('_id title eventType');
    if (!event) {
      console.log('ERROR: No events found');
      await mongoose.connection.close();
      return;
    }

    console.log('\n✓ Found Event:', event.title);
    console.log('  Event ID:', event._id);

    // Create an EventRegistration
    const registration = new EventRegistration({
      studentId: student._id,
      eventId: event._id,
      departmentId: student.departmentId,
      registrationStatus: 'COMPLETED',
      mentorApproved: true,
      mentorApprovedAt: new Date(),
    });

    const savedRegistration = await registration.save();
    console.log('\n✓ Created EventRegistration:', savedRegistration._id);

    // Create PhaseISubmission with FAC2001 as mentor
    const submission = new PhaseISubmission({
      registrationId: savedRegistration._id,
      studentId: student._id,
      eventId: event._id,
      departmentId: student.departmentId,
      eventDetails: {
        eventName: event.title,
        venue: 'SECE Campus',
        startDate: new Date(),
        endDate: new Date(),
        organizerName: 'SECE'
      },
      mentorId: mentorFaculty._id,  // FAC2001 (faculty2@sece.ac.in)
      paymentStatus: 'NOT_REQUIRED',
      paymentAmount: 0,
      currentApprovalStage: 'MENTOR',
      mentorApproval: {
        approved: false,
        notifiedAt: new Date()
      },
      classAdvisorApproval: {
        approved: false
      },
      innovationCoordinatorApproval: {
        approved: false
      },
      hodApproval: {
        approved: false
      }
    });

    const savedSubmission = await submission.save();
    console.log('\n✓ Created PhaseISubmission:', savedSubmission._id);

    console.log('\n=== SUBMISSION DETAILS FOR TESTING ===\n');
    console.log('Submission ID:', savedSubmission._id);
    console.log('\nMENTOR (Should see this submission):');
    console.log('  Email: faculty2@sece.ac.in');
    console.log('  Employee ID: FAC2001');
    console.log('  Status: PENDING APPROVAL');
    console.log('\nStudent:');
    console.log('  Roll Number: CSE001');
    console.log('  Email: student.cse1@sece.ac.in');
    console.log('\nLogin as faculty2@sece.ac.in with password to see this submission');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

createProperSubmission();
