/**
 * Delete invalid EventView records
 * Records where userType is FACULTY but no facultyId (because they're admins)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const EventView = require('./src/models/EventView');
const Event = require('./src/models/Event');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required.');
  process.exit(1);
}

async function deleteInvalidViews() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n📋 Finding invalid EventView records (FACULTY userType without facultyId)...');
    
    // Find invalid records
    const invalidRecords = await EventView.find({
      userType: 'FACULTY',
      facultyId: { $exists: false }
    });
    
    console.log(`Found ${invalidRecords.length} invalid records`);
    
    if (invalidRecords.length === 0) {
      console.log('No invalid records to delete');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Also need to decrement viewCount for each event
    console.log('\n🔧 Decrementing view counts for affected events...');
    for (const record of invalidRecords) {
      console.log(`  - Decrementing count for event ${record.eventId}`);
      await Event.findByIdAndUpdate(record.eventId, { $inc: { viewCount: -1 } });
    }
    
    // Delete the invalid records
    console.log('\n🗑️  Deleting invalid EventView records...');
    const result = await EventView.deleteMany({
      userType: 'FACULTY',
      facultyId: { $exists: false }
    });
    
    console.log(`\n✅ Deleted ${result.deletedCount} invalid EventView records`);
    console.log('✅ View counts decremented for affected events');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteInvalidViews();
