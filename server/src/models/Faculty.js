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
  // Class Advisor Information
  isClassAdvisor: {
    type: Boolean,
    default: false
  },
  advisorForClasses: [{
    year: Number,
    section: String,
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department'
    }
  }],
  
  // Mentor Information (for Phase I submissions)
  isMentor: {
    type: Boolean,
    default: false
  },
  menteeIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  
  // Innovation Coordinator Information (for Phase II submissions)
  isInnovationCoordinator: {
    type: Boolean,
    default: false
  },
  innovationCoordinatorFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
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
