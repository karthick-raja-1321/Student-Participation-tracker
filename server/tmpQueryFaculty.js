const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Faculty = require('./src/models/Faculty');
require('./src/models/User');
require('./src/models/Department');

(async () => {
  dotenv.config();
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-participation-tracker');
  const fac = await Faculty.find({}).populate('userId departmentId').lean();
  console.log(
    fac.map(f => ({
      id: f._id,
      emp: f.employeeId,
      dept: f.departmentId?.code,
      name: `${f.userId?.firstName || ''} ${f.userId?.lastName || ''}`.trim(),
    }))
  );
  await mongoose.disconnect();
})();
