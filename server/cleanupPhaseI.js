const mongoose = require('mongoose');
require('dotenv').config();

const EventRegistration = require('./src/models/EventRegistration');
const PhaseISubmission = require('./src/models/PhaseISubmission');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete all Phase I submissions
    const phaseIResult = await PhaseISubmission.deleteMany({});
    console.log(`Deleted ${phaseIResult.deletedCount} Phase I submissions`);

    // Delete all event registrations
    const regResult = await EventRegistration.deleteMany({});
    console.log(`Deleted ${regResult.deletedCount} event registrations`);

    console.log('Cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

cleanup();
