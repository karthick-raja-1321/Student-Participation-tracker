const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Dept = require('./src/models/Department');

(async () => {
  dotenv.config();
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI environment variable is required.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  const dept = await Dept.findOne({ code: 'CSE' }).lean();
  console.log(dept);
  await mongoose.disconnect();
})();
