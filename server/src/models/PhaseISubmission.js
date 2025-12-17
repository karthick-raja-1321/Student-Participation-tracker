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
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
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
  teamName: String,
  teamMembers: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student'
    },
    rollNumber: String,
    name: String
  }],
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true
  },
  innovationCoordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  principalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Approval tracking with complete hierarchy
  mentorApproval: {
    approved: {
      type: Boolean,
      default: null
    },
    approvedAt: Date,
    comments: String,
    notifiedAt: Date
  },
  classAdvisorApproval: {
    approved: {
      type: Boolean,
      default: null
    },
    approvedAt: Date,
    comments: String,
    notifiedAt: Date
  },
  innovationCoordinatorApproval: {
    approved: {
      type: Boolean,
      default: null
    },
    approvedAt: Date,
    comments: String,
    notifiedAt: Date
  },
  hodApproval: {
    approved: {
      type: Boolean,
      default: null
    },
    approvedAt: Date,
    comments: String,
    notifiedAt: Date
  },
  principalApproval: {
    approved: {
      type: Boolean,
      default: null
    },
    approvedAt: Date,
    comments: String,
    notifiedAt: Date
  },
  // Current approval stage
  currentApprovalStage: {
    type: String,
    enum: ['MENTOR', 'CLASS_ADVISOR', 'INNOVATION_COORDINATOR', 'HOD', 'PRINCIPAL', 'COMPLETED'],
    default: 'MENTOR'
  },
  // Approval timeline for tracking
  approvalTimeline: [{
    stage: String,
    action: String, // APPROVED, REJECTED, PENDING
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    actionAt: Date,
    comments: String
  }],
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
phaseISubmissionSchema.index({ departmentId: 1 });

module.exports = mongoose.model('PhaseISubmission', phaseISubmissionSchema);
