const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Dept = require('./src/models/Department');

(async () => {
  dotenv.config();
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-participation-tracker');
  const dept = await Dept.findOne({ code: 'CSE' }).lean();
  console.log(dept);
  await mongoose.disconnect();
})();
