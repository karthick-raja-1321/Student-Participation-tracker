const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const Faculty = require('./src/models/Faculty');
const User = require('./src/models/User');

async function updateFacultyRoles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-participation-tracker');

    console.log('\n=== UPDATING FACULTY ROLES ===\n');

    // Find faculty13@sece.ac.in (FAC2012)
    const faculty13User = await User.findOne({ email: 'faculty13@sece.ac.in' });
    if (!faculty13User) {
      console.log('faculty13@sece.ac.in not found');
      await mongoose.connection.close();
      return;
    }

    console.log('Found faculty13@sece.ac.in (User ID:', faculty13User._id + ')');

    const faculty13 = await Faculty.findOne({ userId: faculty13User._id });
    if (!faculty13) {
      console.log('Faculty record not found for faculty13@sece.ac.in');
      await mongoose.connection.close();
      return;
    }

    console.log('Current roles:');
    console.log('  isClassAdvisor:', faculty13.isClassAdvisor);
    console.log('  isInnovationCoordinator:', faculty13.isInnovationCoordinator);
    console.log('  isMentor:', faculty13.isMentor);

    // Update to be a mentor
    faculty13.isMentor = true;
    faculty13.isInnovationCoordinator = true;
    
    await faculty13.save();

    console.log('\n✓ Updated faculty13 roles:');
    console.log('  isMentor: true');
    console.log('  isInnovationCoordinator: true');

    // Also check faculty2@sece.ac.in (FAC2001)
    console.log('\n--- Checking FAC2001 (faculty2@sece.ac.in) ---\n');
    const faculty2User = await User.findOne({ email: 'faculty2@sece.ac.in' });
    if (faculty2User) {
      const faculty2 = await Faculty.findOne({ userId: faculty2User._id });
      if (faculty2) {
        console.log('Current roles for faculty2@sece.ac.in:');
        console.log('  isClassAdvisor:', faculty2.isClassAdvisor);
        console.log('  isInnovationCoordinator:', faculty2.isInnovationCoordinator);
        console.log('  isMentor:', faculty2.isMentor);

        // Ensure faculty2 has mentor role
        if (!faculty2.isMentor) {
          faculty2.isMentor = true;
          await faculty2.save();
          console.log('\n✓ Updated faculty2 to isMentor: true');
        }
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

updateFacultyRoles();
