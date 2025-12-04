const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.get('/logs', protect, (req, res) => {
  res.json({ status: 'success', message: 'Get WhatsApp logs - to be implemented', data: [] });
});

router.post('/send-reminder', protect, (req, res) => {
  res.json({ status: 'success', message: 'Send WhatsApp reminder - to be implemented' });
});

module.exports = router;
