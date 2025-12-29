require('dotenv').config();
const mongoose = require('mongoose');
const EventView = require('./src/models/EventView');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required.');
  process.exit(1);
}

async function checkViews() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Checking EventView records...\n');
    
    const facultyViews = await EventView.find({ userType: 'FACULTY' });
    console.log(`Found ${facultyViews.length} FACULTY view records:`);
    facultyViews.forEach(v => {
      console.log(`  - Event: ${v.eventId}, User: ${v.userId}, Faculty: ${v.facultyId || 'MISSING'}`);
    });
    
    const invalidCount = facultyViews.filter(v => !v.facultyId).length;
    console.log(`\n${invalidCount} records without facultyId`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkViews();
