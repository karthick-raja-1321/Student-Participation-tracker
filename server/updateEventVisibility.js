const mongoose = require('mongoose');
require('dotenv').config();

const Event = require('./src/models/Event');

async function updateEventVisibility() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-participation');
    console.log('Connected to MongoDB');

    // Find all events
    const events = await Event.find({});
    console.log(`\nFound ${events.length} events`);

    // Display current visibility
    events.forEach(event => {
      console.log(`- ${event.title}: visibility = ${event.visibility || 'DEPARTMENT (default)'}`);
    });

    // Update events with DEPARTMENT visibility to INSTITUTION
    const result = await Event.updateMany(
      { visibility: 'DEPARTMENT' },
      { $set: { visibility: 'INSTITUTION' } }
    );

    console.log(`\nUpdated ${result.modifiedCount} events from DEPARTMENT to INSTITUTION visibility`);

    // Show updated events
    const updatedEvents = await Event.find({});
    console.log('\nUpdated events:');
    updatedEvents.forEach(event => {
      console.log(`- ${event.title}: visibility = ${event.visibility}`);
    });

    await mongoose.disconnect();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateEventVisibility();
