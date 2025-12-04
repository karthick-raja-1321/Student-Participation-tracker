const mongoose = require('mongoose');
const { SUBMISSION_STATUS, PHASE_II_STATUS } = require('../config/constants');

const phaseIISubmissionSchema = new mongoose.Schema({
  phaseISubmissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PhaseISubmission',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  geoTaggedPhoto: {
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    capturedAt: Date,
    uploadedAt: Date
  },
  participationDocument: {
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    uploadedAt: Date
  },
  prizeDetails: {
    wonPrize: {
      type: Boolean,
      default: false
    },
    prizePosition: String,
    prizeAmount: Number,
    prizeName: String
  },
  isOnDuty: {
    type: Boolean,
    default: false
  },
  onDutyApprovalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  onDutyApproverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  certificates: [{
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    uploadedAt: Date
  }],
  eventReport: {
    reportText: {
      type: String,
      minlength: 100,
      maxlength: 5000
    },
    keyLearnings: [String],
    reportDocument: {
      fileUrl: String,
      fileName: String,
      fileSize: Number,
      uploadedAt: Date
    }
  },
  status: {
    type: String,
    enum: Object.values(SUBMISSION_STATUS),
    default: SUBMISSION_STATUS.DRAFT
  },
  phaseIIStatus: {
    type: String,
    enum: Object.values(PHASE_II_STATUS),
    default: PHASE_II_STATUS.NOT_STARTED
  },
  submittedAt: Date,
  isDraft: {
    type: Boolean,
    default: true
  },
  isOverdue: {
    type: Boolean,
    default: false
  },
  daysPending: {
    type: Number,
    default: 0
  },
  reminderCount: {
    type: Number,
    default: 0
  },
  lastReminderSent: Date
}, {
  timestamps: true
});

// Indexes
phaseIISubmissionSchema.index({ phaseISubmissionId: 1 }, { unique: true });
phaseIISubmissionSchema.index({ studentId: 1, eventId: 1 });
phaseIISubmissionSchema.index({ status: 1 });
phaseIISubmissionSchema.index({ phaseIIStatus: 1 });
phaseIISubmissionSchema.index({ isOverdue: 1 });

module.exports = mongoose.model('PhaseIISubmission', phaseIISubmissionSchema);
