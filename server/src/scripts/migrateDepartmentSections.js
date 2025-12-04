/**
 * Migration script to add numberOfSections field to existing departments
 * Run this once after updating the Department model
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('../models/Department');

const updateDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all departments that don't have numberOfSections
    const result = await Department.updateMany(
      { numberOfSections: { $exists: false } },
      { $set: { numberOfSections: 3 } }
    );

    console.log(`Updated ${result.modifiedCount} departments with numberOfSections: 3`);

    // You can manually set specific departments to have different sections
    // Example: Set CSE to have 4 sections
    // await Department.updateOne(
    //   { code: 'CSE' },
    //   { $set: { numberOfSections: 4 } }
    // );

    // List all departments with their section counts
    const departments = await Department.find({}, 'code name numberOfSections');
    console.log('\nDepartments and their sections:');
    departments.forEach(dept => {
      console.log(`  ${dept.code} (${dept.name}): ${dept.numberOfSections} sections`);
    });

    await mongoose.connection.close();
    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

updateDepartments();
