const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Department = require('../models/Department');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const PhaseISubmission = require('../models/PhaseISubmission');
const PhaseIISubmission = require('../models/PhaseIISubmission');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Department.deleteMany({});
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Event.deleteMany({});
    await EventRegistration.deleteMany({});
    await PhaseISubmission.deleteMany({});
    await PhaseIISubmission.deleteMany({});
    console.log('Cleared existing data');

    // Create Departments
    const departments = await Department.insertMany([
      {
        name: 'Computer Science and Engineering',
        code: 'CSE',
        description: 'Department of Computer Science and Engineering',
        isActive: true,
      },
      {
        name: 'Electronics and Communication Engineering',
        code: 'ECE',
        description: 'Department of Electronics and Communication Engineering',
        isActive: true,
      },
      {
        name: 'Electrical and Electronics Engineering',
        code: 'EEE',
        description: 'Department of Electrical and Electronics Engineering',
        isActive: true,
      },
      {
        name: 'Mechanical Engineering',
        code: 'MECH',
        description: 'Department of Mechanical Engineering',
        isActive: true,
      },
      {
        name: 'Civil Engineering',
        code: 'CIVIL',
        description: 'Department of Civil Engineering',
        isActive: true,
      },
    ]);
    console.log(`Created ${departments.length} departments`);

    // Create Super Admin
    const superAdmin = await User.create({
      email: 'admin@sece.ac.in',
      password: 'Password123',
      role: 'SUPER_ADMIN',
      firstName: 'Super',
      lastName: 'Admin',
      phone: '9876543210',
      isActive: true,
    });
    console.log('Created Super Admin');

    // Create HODs
    const hods = [];
    for (let i = 0; i < departments.length; i++) {
      const hod = await User.create({
        email: `hod.${departments[i].code.toLowerCase()}@sece.ac.in`,
        password: 'Password123',
        role: 'HOD',
        firstName: `HOD`,
        lastName: departments[i].code,
        phone: `98765432${10 + i}`,
        departmentId: departments[i]._id,
        employeeId: `HOD${1000 + i}`,
        isActive: true,
      });
      hods.push(hod);

      // Update department with HOD
      await Department.findByIdAndUpdate(departments[i]._id, { hodId: hod._id });
    }
    console.log(`Created ${hods.length} HODs`);

    // Create Faculty members
    const faculties = [];
    for (let i = 0; i < departments.length; i++) {
      for (let j = 0; j < 3; j++) {
        const employeeId = `FAC${2000 + i * 3 + j}`;
        const facultyUser = await User.create({
          email: `faculty${i * 3 + j + 1}@sece.ac.in`,
          password: 'Password123',
          role: 'FACULTY',
          firstName: `Faculty${i * 3 + j + 1}`,
          lastName: departments[i].code,
          phone: `98765${43210 + i * 3 + j}`,
          departmentId: departments[i]._id,
          employeeId: employeeId,
          isActive: true,
        });

        const faculty = await Faculty.create({
          userId: facultyUser._id,
          departmentId: departments[i]._id,
          employeeId: employeeId,
          designation: j === 0 ? 'Professor' : j === 1 ? 'Associate Professor' : 'Assistant Professor',
          qualification: 'Ph.D.',
          specialization: 'Computer Science',
        });
        faculties.push(faculty);
      }
    }
    console.log(`Created ${faculties.length} faculty members`);

    // Create Students
    const students = [];
    const studentUsers = [];
    for (let i = 0; i < departments.length; i++) {
      for (let year = 1; year <= 4; year++) {
        for (let section of ['A', 'B']) {
          for (let j = 1; j <= 5; j++) {
            const registerNumber = `${21 + year}${departments[i].code}${section}${String(j).padStart(3, '0')}`;
            
            const studentUser = await User.create({
              email: `${registerNumber.toLowerCase()}@student.sece.ac.in`,
              password: 'Password123',
              role: 'STUDENT',
              firstName: `Student${registerNumber}`,
              lastName: departments[i].code,
              phone: `9${String(Math.floor(Math.random() * 999999999)).padStart(9, '0')}`,
              departmentId: departments[i]._id,
              isActive: true,
            });
            studentUsers.push(studentUser);

            const student = await Student.create({
              userId: studentUser._id,
              rollNumber: registerNumber,
              departmentId: departments[i]._id,
              year,
              section,
              classAdvisorId: faculties[i * 3]._id, // Assign first faculty as class advisor
              mentorId: faculties[i * 3 + 1]._id, // Assign second faculty as mentor
            });
            students.push(student);
          }
        }
      }
    }
    console.log(`Created ${students.length} students`);

    // Create Events
    const events = await Event.insertMany([
      {
        title: 'National Level Hackathon 2025',
        description: 'A 24-hour coding competition focusing on innovative solutions for real-world problems',
        eventType: 'HACKATHON',
        organizerName: 'CSE Department',
        organizerContact: 'cse@sece.ac.in',
        organizerPhone: '9876543210',
        venue: 'SECE Campus',
        startDate: new Date('2025-03-15'),
        endDate: new Date('2025-03-16'),
        registrationDeadline: new Date('2025-03-10'),
        maxParticipants: 200,
        currentParticipants: 0,
        visibility: 'EXTERNAL',
        eventLevel: 'NATIONAL',
        createdBy: hods[0]._id,
        departmentId: departments[0]._id,
        status: 'PUBLISHED',
        tags: ['coding', 'innovation', 'technology'],
      },
      {
        title: 'International Conference on AI & ML',
        description: 'Academic conference on latest trends in Artificial Intelligence and Machine Learning',
        eventType: 'CONFERENCE',
        organizerName: 'CSE Department',
        organizerContact: 'cse@sece.ac.in',
        organizerPhone: '9876543210',
        venue: 'Convention Center',
        startDate: new Date('2025-04-20'),
        endDate: new Date('2025-04-22'),
        registrationDeadline: new Date('2025-04-10'),
        maxParticipants: 500,
        currentParticipants: 0,
        visibility: 'EXTERNAL',
        eventLevel: 'INTERNATIONAL',
        createdBy: hods[0]._id,
        departmentId: departments[0]._id,
        status: 'PUBLISHED',
        tags: ['AI', 'ML', 'research', 'conference'],
      },
      {
        title: 'Technical Workshop on Web Development',
        description: 'Hands-on workshop covering MERN stack development',
        eventType: 'WORKSHOP',
        organizerName: 'Tech Club',
        organizerContact: 'techclub@sece.ac.in',
        organizerPhone: '9876543211',
        venue: 'Lab 301',
        startDate: new Date('2025-02-10'),
        endDate: new Date('2025-02-10'),
        registrationDeadline: new Date('2025-02-05'),
        maxParticipants: 50,
        currentParticipants: 0,
        visibility: 'DEPARTMENT',
        eventLevel: 'INSTITUTIONAL',
        createdBy: faculties[0]._id,
        departmentId: departments[0]._id,
        status: 'PUBLISHED',
        tags: ['web', 'MERN', 'workshop'],
      },
      {
        title: 'Project Expo 2025',
        description: 'Annual project exhibition showcasing final year projects',
        eventType: 'SYMPOSIUM',
        organizerName: 'All Departments',
        organizerContact: 'expo@sece.ac.in',
        organizerPhone: '9876543212',
        venue: 'Main Auditorium',
        startDate: new Date('2025-05-01'),
        endDate: new Date('2025-05-02'),
        registrationDeadline: new Date('2025-04-25'),
        maxParticipants: 300,
        currentParticipants: 0,
        visibility: 'INSTITUTION',
        eventLevel: 'INSTITUTIONAL',
        createdBy: superAdmin._id,
        status: 'PUBLISHED',
        tags: ['projects', 'innovation', 'exhibition'],
      },
      {
        title: 'Coding Contest - CodeChef',
        description: 'Online competitive programming contest',
        eventType: 'COMPETITION',
        organizerName: 'Coding Club',
        organizerContact: 'coding@sece.ac.in',
        organizerPhone: '9876543213',
        venue: 'Online',
        startDate: new Date('2025-02-25'),
        endDate: new Date('2025-02-25'),
        registrationDeadline: new Date('2025-02-20'),
        maxParticipants: 100,
        currentParticipants: 0,
        visibility: 'EXTERNAL',
        eventLevel: 'INSTITUTIONAL',
        createdBy: faculties[1]._id,
        departmentId: departments[0]._id,
        status: 'PUBLISHED',
        tags: ['coding', 'competition', 'online'],
      },
    ]);
    console.log(`Created ${events.length} events`);

    // Create Sample Event Registrations (without Phase I/II submissions for simplicity)
    const registrations = [];
    
    // Register first 20 students to the hackathon
    for (let i = 0; i < 20; i++) {
      const registration = await EventRegistration.create({
        eventId: events[0]._id,
        studentId: students[i]._id,
        participationType: i % 3 === 0 ? 'TEAM' : 'INDIVIDUAL',
        teamName: i % 3 === 0 ? `Team ${Math.floor(i / 3) + 1}` : undefined,
        teamMembers: i % 3 === 0 ? [{
          studentId: students[i + 1]._id,
          rollNumber: students[i + 1].rollNumber,
          name: `${students[i + 1].firstName} ${students[i + 1].lastName}`
        }] : undefined,
        paymentAmount: 500,
        paymentStatus: i % 2 === 0 ? 'PAID' : 'PENDING',
        paymentDate: i % 2 === 0 ? new Date() : undefined,
      });
      registrations.push(registration);
    }

    // Register students to workshop
    for (let i = 20; i < 35; i++) {
      const registration = await EventRegistration.create({
        eventId: events[2]._id,
        studentId: students[i]._id,
        participationType: 'INDIVIDUAL',
        paymentAmount: 0,
        paymentStatus: 'NOT_REQUIRED',
      });
      registrations.push(registration);
    }

    console.log(`Created ${registrations.length} registrations`);

    // Update event participant counts
    await Event.findByIdAndUpdate(events[0]._id, { currentParticipants: 20 });
    await Event.findByIdAndUpdate(events[2]._id, { currentParticipants: 15 });

    console.log('\n=================================');
    console.log('DATABASE SEEDING COMPLETED!');
    console.log('=================================\n');
    
    console.log('Sample Login Credentials:');
    console.log('\nSuper Admin:');
    console.log('  Email: admin@sece.ac.in');
    console.log('  Password: Password123');
    
    console.log('\nHOD (CSE):');
    console.log('  Email: hod.cse@sece.ac.in');
    console.log('  Password: Password123');
    
    console.log('\nFaculty:');
    console.log('  Email: faculty1@sece.ac.in');
    console.log('  Password: Password123');
    
    console.log('\nStudent:');
    console.log('  Email: 22csea001@student.sece.ac.in');
    console.log('  Password: Password123');
    
    console.log('\nDatabase Statistics:');
    console.log(`  Departments: ${departments.length}`);
    console.log(`  Users: ${await User.countDocuments()}`);
    console.log(`  Students: ${students.length}`);
    console.log(`  Faculty: ${faculties.length}`);
    console.log(`  Events: ${events.length}`);
    console.log(`  Registrations: ${registrations.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
