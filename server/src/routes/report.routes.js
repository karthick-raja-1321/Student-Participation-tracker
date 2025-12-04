const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const reportController = require('../controllers/report.controller');

router.get('/dashboard', protect, reportController.getDashboardStats);
router.get('/participation', protect, reportController.getParticipationReport);
router.get('/export', protect, reportController.exportParticipationReport);
router.get('/export-with-proofs', protect, reportController.exportWithProofs);

module.exports = router;
