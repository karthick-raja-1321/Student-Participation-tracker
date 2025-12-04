const mongoose = require('mongoose');
const { APPROVAL_LEVELS } = require('../config/constants');

const approvalSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'submissionType'
  },
  submissionType: {
    type: String,
    required: true,
    enum: ['PhaseISubmission', 'PhaseIISubmission']
  },
  phase: {
    type: String,
    enum: ['PHASE_I', 'PHASE_II'],
    required: true
  },
  approvalLevel: {
    type: String,
    enum: Object.values(APPROVAL_LEVELS),
    required: true
  },
  approverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    enum: ['APPROVED', 'REJECTED', 'REVISION_REQUESTED'],
    required: true
  },
  comments: String,
  actionDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
approvalSchema.index({ submissionId: 1, phase: 1 });
approvalSchema.index({ approverId: 1 });
approvalSchema.index({ action: 1 });

module.exports = mongoose.model('Approval', approvalSchema);
