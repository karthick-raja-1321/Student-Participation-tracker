/**
 * Script to activate all inactive departments
 * Run with: node activateAllDepartments.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spt');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const activateAllDepartments = async () => {
  try {
    // Get the Department model
    const db = mongoose.connection;
    
    // Find all inactive departments
    const result = await db.collection('departments').updateMany(
      { isActive: false },
      { $set: { isActive: true } }
    );

    console.log(`\n✅ Successfully activated departments!`);
    console.log(`   - Matched: ${result.matchedCount} inactive departments`);
    console.log(`   - Modified: ${result.modifiedCount} departments\n`);

    if (result.modifiedCount === 0) {
      console.log('ℹ️  No inactive departments found to activate.\n');
    }

    // Show all departments status
    const allDepts = await db.collection('departments').find({}).toArray();
    console.log(`📋 Total departments in system: ${allDepts.length}`);
    console.log(`   Active: ${allDepts.filter(d => d.isActive).length}`);
    console.log(`   Inactive: ${allDepts.filter(d => !d.isActive).length}\n`);

    process.exit(0);
  } catch (error) {
    console.error('Error activating departments:', error.message);
    process.exit(1);
  }
};

const run = async () => {
  await connectDB();
  await activateAllDepartments();
};

run();
