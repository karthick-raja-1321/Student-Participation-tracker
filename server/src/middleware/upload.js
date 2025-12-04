const multer = require('multer');
const path = require('path');
const { FILE_LIMITS } = require('../config/constants');

// Configure memory storage (files will be in req.file.buffer)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = FILE_LIMITS.ALLOWED_TYPES;
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: FILE_LIMITS.MAX_SIZE
  },
  fileFilter: fileFilter
});

module.exports = upload;
