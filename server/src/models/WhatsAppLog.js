const mongoose = require('mongoose');

const whatsappLogSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'submissionType'
  },
  submissionType: {
    type: String,
    enum: ['PhaseISubmission', 'PhaseIISubmission']
  },
  messageSid: String,
  status: {
    type: String,
    enum: ['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'UNDELIVERED'],
    default: 'QUEUED'
  },
  errorMessage: String,
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: Date
}, {
  timestamps: true
});

// TTL Index - Auto-delete after 180 days
whatsappLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 });
whatsappLogSchema.index({ recipientId: 1 });
whatsappLogSchema.index({ status: 1 });

module.exports = mongoose.model('WhatsAppLog', whatsappLogSchema);
