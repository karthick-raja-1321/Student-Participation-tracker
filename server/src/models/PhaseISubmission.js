const mongoose = require('mongoose');
const { SUBMISSION_STATUS } = require('../config/constants');

const phaseISubmissionSchema = new mongoose.Schema({
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EventRegistration',
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
  eventDetails: {
    eventName: {
      type: String,
      required: true
    },
    venue: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    organizerName: {
      type: String,
      required: true
    }
  },
  selectionProof: {
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    uploadedAt: Date
  },
  paymentProof: {
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    uploadedAt: Date
  },
  odRequestForm: {
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    uploadedAt: Date
  },
  advisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(SUBMISSION_STATUS),
    default: SUBMISSION_STATUS.DRAFT
  },
  submittedAt: Date,
  isDraft: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
phaseISubmissionSchema.index({ studentId: 1, eventId: 1 });
phaseISubmissionSchema.index({ status: 1 });
phaseISubmissionSchema.index({ advisorId: 1 });
phaseISubmissionSchema.index({ mentorId: 1 });

module.exports = mongoose.model('PhaseISubmission', phaseISubmissionSchema);
