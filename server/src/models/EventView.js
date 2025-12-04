const mongoose = require('mongoose');

const eventViewSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['STUDENT', 'FACULTY'],
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  viewedAt: {
    type: Date,
    default: Date.now
  },
  // Track how many times they viewed
  viewCount: {
    type: Number,
    default: 1
  },
  lastViewedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes
eventViewSchema.index({ eventId: 1, userId: 1 }, { unique: true });
eventViewSchema.index({ eventId: 1, userType: 1 });
eventViewSchema.index({ studentId: 1 });
eventViewSchema.index({ facultyId: 1 });

module.exports = mongoose.model('EventView', eventViewSchema);
