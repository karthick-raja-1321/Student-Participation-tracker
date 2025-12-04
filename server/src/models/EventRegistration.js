const mongoose = require('mongoose');
const { PARTICIPATION_TYPES } = require('../config/constants');

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  participationType: {
    type: String,
    enum: Object.values(PARTICIPATION_TYPES),
    default: PARTICIPATION_TYPES.INDIVIDUAL
  },
  teamName: String,
  teamMembers: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    rollNumber: String,
    name: String
  }],
  registrationDate: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'PAID', 'NOT_REQUIRED'],
    default: 'NOT_REQUIRED'
  },
  paymentAmount: Number,
  paymentDate: Date,
  isCancelled: {
    type: Boolean,
    default: false
  },
  cancelledAt: Date
}, {
  timestamps: true
});

// Compound indexes
registrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });
registrationSchema.index({ studentId: 1 });
registrationSchema.index({ eventId: 1 });

module.exports = mongoose.model('EventRegistration', registrationSchema);
