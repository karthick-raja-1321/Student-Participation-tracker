const mongoose = require('mongoose');

const excelImportLogSchema = new mongoose.Schema({
  importType: {
    type: String,
    enum: ['STUDENTS', 'FACULTY', 'DEPARTMENTS', 'CLASS_MAPPING', 'MENTOR_MAPPING'],
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: Number,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  status: {
    type: String,
    enum: ['PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL'],
    default: 'PROCESSING'
  },
  totalRows: {
    type: Number,
    default: 0
  },
  successCount: {
    type: Number,
    default: 0
  },
  failureCount: {
    type: Number,
    default: 0
  },
  duplicateCount: {
    type: Number,
    default: 0
  },
  errors: [{
    row: Number,
    field: String,
    message: String,
    data: mongoose.Schema.Types.Mixed
  }],
  processingTime: Number,
  errorReportUrl: String,
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true,
  suppressReservedKeysWarning: true
});

// Indexes
excelImportLogSchema.index({ uploadedBy: 1 });
excelImportLogSchema.index({ status: 1 });
excelImportLogSchema.index({ importType: 1, departmentId: 1 });

module.exports = mongoose.model('ExcelImportLog', excelImportLogSchema);
