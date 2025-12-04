const mongoose = require('mongoose');
require('dotenv').config();
const Student = require('./src/models/Student');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Search for students with roll numbers containing "141" or "143"
    const students = await Student.find({ 
      rollNumber: { $regex: '14[13]', $options: 'i' } 
    }).populate('userId');
    
    console.log(`\nFound ${students.length} students matching pattern:`);
    students.forEach(s => {
      console.log(`  - ${s.rollNumber}: ${s.userId?.firstName} ${s.userId?.lastName} (${s.userId?.email})`);
    });
    
    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
