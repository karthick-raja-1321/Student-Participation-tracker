const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const Notification = require('./src/models/Notification');
const PhaseISubmission = require('./src/models/PhaseISubmission');
const Faculty = require('./src/models/Faculty');
const User = require('./src/models/User');
const Student = require('./src/models/Student');
const Event = require('./src/models/Event');
const { NOTIFICATION_TYPES } = require('./src/config/constants');

async function createMentorNotification() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-participation-tracker');

    console.log('\n=== CREATING MENTOR NOTIFICATION FOR FACULTY13 ===\n');

    // Find the latest submission for faculty13
    const faculty13 = await Faculty.findOne({ employeeId: 'FAC2012' });
    if (!faculty13) {
      console.log('FAC2012 not found');
      await mongoose.connection.close();
      return;
    }

    console.log('✓ Found Faculty13:', faculty13._id);

    // Find submission where faculty13 is mentor
    const submission = await PhaseISubmission.findOne({ mentorId: faculty13._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate('eventId', 'title');

    if (!submission) {
      console.log('No submission found for faculty13');
      await mongoose.connection.close();
      return;
    }

    console.log('✓ Found Submission:', submission._id);
    console.log('  Student:', submission.studentId?.userId?.firstName, submission.studentId?.userId?.lastName);
    console.log('  Event:', submission.eventId?.title);

    // Get faculty13 user
    const faculty13User = await User.findOne({ _id: faculty13.userId });
    if (!faculty13User) {
      console.log('User not found for faculty13');
      await mongoose.connection.close();
      return;
    }

    console.log('✓ Found Faculty13 User:', faculty13User.email);

    // Create notification
    const studentName = `${submission.studentId?.userId?.firstName || ''} ${submission.studentId?.userId?.lastName || ''}`.trim();
    const eventTitle = submission.eventId?.title || 'an event';

    const notification = await Notification.create({
      userId: faculty13User._id,
      type: NOTIFICATION_TYPES.SUBMISSION,
      title: 'New Submission Requires Your Approval',
      message: `${studentName} has submitted an On-Duty request for "${eventTitle}". Please review and approve as mentor.`,
      relatedId: submission._id,
      relatedModel: 'PhaseISubmission',
      read: false
    });

    console.log('\n✓ Created Notification:', notification._id);
    console.log('  Title:', notification.title);
    console.log('  Message:', notification.message);
    console.log('  User:', faculty13User.email);

    console.log('\n✓ SUCCESS: Notification created for faculty13@sece.ac.in');
    console.log('\nLogin to see the notification in the app.');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
  }
}

createMentorNotification();
