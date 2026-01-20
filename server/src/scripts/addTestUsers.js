const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Department = require('../models/Department');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const departments = await Department.find({}).limit(1);
    if (!departments.length) {
      console.error('No departments found. Run seedData.js first.');
      process.exit(1);
    }
    const testDept = departments[0];

    // Check and create ts001
    let ts1User = await User.findOne({ email: 'ts001@sece.ac.in' });
    if (!ts1User) {
      ts1User = await User.create({
        email: 'ts001@sece.ac.in',
        password: 'Password123',
        role: 'STUDENT',
        firstName: 'Test',
        lastName: 'Student1',
        phone: '9000000001',
        departmentId: testDept._id,
        isActive: true
      });
      await Student.create({
        userId: ts1User._id,
        rollNumber: 'TS001',
        departmentId: testDept._id,
        year: 2,
        section: 'A'
      });
      console.log('Created ts001@sece.ac.in');
    } else {
      console.log('ts001 already exists');
    }

    // ts002
    let ts2User = await User.findOne({ email: 'ts002@sece.ac.in' });
    if (!ts2User) {
      ts2User = await User.create({
        email: 'ts002@sece.ac.in',
        password: 'Password123',
        role: 'STUDENT',
        firstName: 'Test',
        lastName: 'Student2',
        phone: '9000000002',
        departmentId: testDept._id,
        isActive: true
      });
      await Student.create({
        userId: ts2User._id,
        rollNumber: 'TS002',
        departmentId: testDept._id,
        year: 2,
        section: 'A'
      });
      console.log('Created ts002@sece.ac.in');
    } else {
      console.log('ts002 already exists');
    }

    // tf001
    let tf1User = await User.findOne({ email: 'tf001@sece.ac.in' });
    if (!tf1User) {
      tf1User = await User.create({
        email: 'tf001@sece.ac.in',
        password: 'Password123',
        role: 'FACULTY',
        firstName: 'Test',
        lastName: 'Faculty1',
        phone: '9000000100',
        departmentId: testDept._id,
        employeeId: 'TF001',
        isActive: true
      });
      await Faculty.create({
        userId: tf1User._id,
        departmentId: testDept._id,
        employeeId: 'TF001',
        designation: 'Assistant Professor'
      });
      console.log('Created tf001@sece.ac.in');
    } else {
      console.log('tf001 already exists');
    }

    // tf002 - advisor + coordinator
    let tf2User = await User.findOne({ email: 'tf002@sece.ac.in' });
    if (!tf2User) {
      tf2User = await User.create({
        email: 'tf002@sece.ac.in',
        password: 'Password123',
        role: 'FACULTY',
        firstName: 'Advisor',
        lastName: 'Coordinator',
        phone: '9000000101',
        departmentId: testDept._id,
        employeeId: 'TF002',
        isActive: true
      });
      await Faculty.create({
        userId: tf2User._id,
        departmentId: testDept._id,
        employeeId: 'TF002',
        designation: 'Associate Professor',
        isClassAdvisor: true,
        advisorForClasses: [{ year: 2, section: 'A', departmentId: testDept._id }],
        isInnovationCoordinator: true,
        innovationCoordinatorFor: [testDept._id]
      });
      console.log('Created tf002@sece.ac.in (advisor + coordinator)');
    } else {
      console.log('tf002 already exists');
    }

    // th001 - HoD
    let th1User = await User.findOne({ email: 'th001@sece.ac.in' });
    if (!th1User) {
      th1User = await User.create({
        email: 'th001@sece.ac.in',
        password: 'Password123',
        role: 'HOD',
        firstName: 'Test',
        lastName: 'HOD1',
        phone: '9000000200',
        departmentId: testDept._id,
        employeeId: 'TH001',
        isActive: true
      });
      await Department.findByIdAndUpdate(testDept._id, { hodId: th1User._id });
      console.log('Created th001@sece.ac.in and linked to department');
    } else {
      console.log('th001 already exists');
    }

    console.log('\nTest users added (password: Password123).');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error adding test users:', err);
    process.exit(1);
  }
};

run();
