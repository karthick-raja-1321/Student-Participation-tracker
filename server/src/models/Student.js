const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 1,
    max: 4
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    uppercase: true,
    trim: true
  },
  cgpa: {
    type: Number,
    min: 0,
    max: 10
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please provide a valid 10-digit phone number']
  },
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  onDuty: {
    totalAllowed: {
      type: Number,
      default: 7
    },
    availed: {
      type: Number,
      default: 0
    },
    balance: {
      type: Number,
      default: 7
    },
    lastUpdated: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for performance (unique fields already create indexes)
studentSchema.index({ departmentId: 1, year: 1, section: 1 });
studentSchema.index({ advisorId: 1 });
studentSchema.index({ mentorId: 1 });

module.exports = mongoose.model('Student', studentSchema);
