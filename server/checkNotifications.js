const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const Notification = require('./src/models/Notification');
const Faculty = require('./src/models/Faculty');
const User = require('./src/models/User');

async function checkNotifications() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-participation-tracker');

    console.log('\n=== CHECKING NOTIFICATIONS FOR FACULTY13 ===\n');

    // Find faculty13
    const faculty13User = await User.findOne({ email: 'faculty13@sece.ac.in' });
    if (!faculty13User) {
      console.log('faculty13@sece.ac.in not found');
      await mongoose.connection.close();
      return;
    }

    console.log('Found faculty13@sece.ac.in');
    console.log('User ID:', faculty13User._id);

    // Check notifications for this user
    const notifications = await Notification.find({ userId: faculty13User._id })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`\nTotal Notifications: ${notifications.length}`);

    if (notifications.length === 0) {
      console.log('\n❌ No notifications found for faculty13');
      console.log('\nThis could be because:');
      console.log('1. Mentor notifications are not being created');
      console.log('2. UserId mapping is incorrect');
      console.log('3. Notification service is not being called');
    } else {
      console.log('\n✓ Notifications found:\n');
      notifications.forEach((notif, index) => {
        console.log(`${index + 1}. ${notif.title}`);
        console.log(`   Message: ${notif.message}`);
        console.log(`   Type: ${notif.type}`);
        console.log(`   Read: ${notif.read}`);
        console.log(`   Created: ${notif.createdAt}`);
        console.log('');
      });
    }

    // Check faculty record
    const faculty13 = await Faculty.findOne({ userId: faculty13User._id });
    if (faculty13) {
      console.log('\n=== FACULTY13 RECORD ===');
      console.log('Faculty ID:', faculty13._id);
      console.log('Employee ID:', faculty13.employeeId);
      console.log('isMentor:', faculty13.isMentor);
      console.log('isClassAdvisor:', faculty13.isClassAdvisor);
      console.log('isInnovationCoordinator:', faculty13.isInnovationCoordinator);
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkNotifications();
