const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Department code is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  hodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    match: [/^[6-9]\d{9}$/, 'Please provide a valid Indian phone number']
  },
  establishedYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  numberOfSections: {
    type: Number,
    default: 3,
    min: 1,
    max: 4,
    required: [true, 'Number of sections is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for performance
departmentSchema.index({ code: 1 });
departmentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Department', departmentSchema);
