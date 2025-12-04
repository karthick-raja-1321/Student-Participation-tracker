const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  designation: {
    type: String,
    trim: true
  },
  isClassAdvisor: {
    type: Boolean,
    default: false
  },
  advisorForClasses: [{
    year: Number,
    section: String
  }],
  isMentor: {
    type: Boolean,
    default: false
  },
  menteeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  isInnovationCoordinator: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
facultySchema.index({ employeeId: 1 });
facultySchema.index({ departmentId: 1 });
facultySchema.index({ 'advisorForClasses.year': 1, 'advisorForClasses.section': 1 });

module.exports = mongoose.model('Faculty', facultySchema);
