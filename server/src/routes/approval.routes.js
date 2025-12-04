const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Approval = require('../models/Approval');

// Basic approvals listing to avoid 404s
router.get('/', protect, async (req, res, next) => {
  try {
    const { level = 'L1', status } = req.query;
    const filter = {};
    if (level) filter.level = level; // assuming model has `level` or `phase`
    if (status) filter.action = status; // APPROVED/REJECTED/PENDING

    // Return minimal data for now; replace with proper controller when ready
    const approvals = await Approval.find(filter)
      .limit(50)
      .sort({ createdAt: -1 });

    res.json({ status: 'success', data: { approvals } });
  } catch (err) {
    next(err);
  }
});

router.get('/queue', protect, (req, res) => {
  res.json({ status: 'success', message: 'Get approval queue - to be implemented', data: [] });
});

router.post('/approve/:submissionId', protect, (req, res) => {
  res.json({ status: 'success', message: 'Approve submission - to be implemented' });
});

router.post('/reject/:submissionId', protect, (req, res) => {
  res.json({ status: 'success', message: 'Reject submission - to be implemented' });
});

module.exports = router;
