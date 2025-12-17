/**
 * Migration Script: Fix EventView records with missing facultyId
 * This script finds EventView records where facultyId is missing but userType is FACULTY
 * and populates the facultyId by looking up the Faculty record from userId
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Import models
const EventView = require('./src/models/EventView');
const Faculty = require('./src/models/Faculty');
const Student = require('./src/models/Student');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student-participation';

async function fixEventViewData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fix FACULTY records with missing facultyId
    console.log('\n📋 Finding FACULTY EventView records with missing facultyId...');
    const facultyViewsWithoutId = await EventView.find({
      userType: 'FACULTY',
      facultyId: { $exists: false }
    });

    console.log(`Found ${facultyViewsWithoutId.length} FACULTY records without facultyId`);

    let updatedFaculty = 0;
    let failedFaculty = 0;

    for (const view of facultyViewsWithoutId) {
      try {
        // Find the faculty record for this user
        const faculty = await Faculty.findOne({ userId: view.userId });
        
        if (faculty) {
          // Update the EventView record with facultyId
          await EventView.findByIdAndUpdate(
            view._id,
            { facultyId: faculty._id },
            { new: true }
          );
          updatedFaculty++;
          console.log(`✅ Updated faculty view: ${view._id} -> facultyId: ${faculty._id}`);
        } else {
          console.warn(`⚠️  No faculty found for userId: ${view.userId}`);
          failedFaculty++;
        }
      } catch (error) {
        console.error(`❌ Error updating view ${view._id}:`, error.message);
        failedFaculty++;
      }
    }

    // Fix STUDENT records with missing studentId
    console.log('\n📋 Finding STUDENT EventView records with missing studentId...');
    const studentViewsWithoutId = await EventView.find({
      userType: 'STUDENT',
      studentId: { $exists: false }
    });

    console.log(`Found ${studentViewsWithoutId.length} STUDENT records without studentId`);

    let updatedStudent = 0;
    let failedStudent = 0;

    for (const view of studentViewsWithoutId) {
      try {
        // Find the student record for this user
        const student = await Student.findOne({ userId: view.userId });
        
        if (student) {
          // Update the EventView record with studentId
          await EventView.findByIdAndUpdate(
            view._id,
            { studentId: student._id },
            { new: true }
          );
          updatedStudent++;
          console.log(`✅ Updated student view: ${view._id} -> studentId: ${student._id}`);
        } else {
          console.warn(`⚠️  No student found for userId: ${view.userId}`);
          failedStudent++;
        }
      } catch (error) {
        console.error(`❌ Error updating view ${view._id}:`, error.message);
        failedStudent++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Faculty Records:`);
    console.log(`  ✅ Updated: ${updatedFaculty}`);
    console.log(`  ❌ Failed: ${failedFaculty}`);
    console.log(`\nStudent Records:`);
    console.log(`  ✅ Updated: ${updatedStudent}`);
    console.log(`  ❌ Failed: ${failedStudent}`);
    console.log(`\n✅ Migration completed successfully!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
fixEventViewData();
