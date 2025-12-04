const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', protect, upload.single('file'), (req, res) => {
  res.json({ status: 'success', message: 'File upload - to be implemented', data: { url: '' } });
});

router.delete('/:fileId', protect, (req, res) => {
  res.json({ status: 'success', message: 'File deletion - to be implemented' });
});

module.exports = router;
