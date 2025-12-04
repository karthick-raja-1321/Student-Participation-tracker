const mongoose = require('mongoose');
const { EVENT_TYPES, EVENT_VISIBILITY } = require('../config/constants');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Event description is required']
  },
  eventType: {
    type: String,
    enum: Object.values(EVENT_TYPES),
    required: true
  },
  visibility: {
    type: String,
    enum: Object.values(EVENT_VISIBILITY),
    default: EVENT_VISIBILITY.DEPARTMENT
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  organizerName: {
    type: String,
    required: [true, 'Organizer name is required'],
    trim: true
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  prizePool: {
    type: Number,
    default: 0,
    min: 0
  },
  eligibility: {
    minYear: {
      type: Number,
      min: 1,
      max: 4
    },
    maxYear: {
      type: Number,
      min: 1,
      max: 4
    },
    minCGPA: {
      type: Number,
      min: 0,
      max: 10
    }
  },
  posterUrl: String,
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  publishedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  registrationLink: {
    type: String,
    trim: true
  },
  registeredCount: {
    type: Number,
    default: 0,
    min: 0
  },
  createdByFacultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedByFacultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  deletedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for performance
eventSchema.index({ visibility: 1, departmentId: 1 });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ isPublished: 1 });
eventSchema.index({ eventType: 1 });

// Validation: endDate must be after startDate
eventSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    return next(new Error('End date must be after start date'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
