const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { hasPermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/constants');
const upload = require('../middleware/upload');
const phaseIIController = require('../controllers/phaseII.controller');

// On-duty approval routes - MUST come before /:id routes
router.get('/on-duty/pending', protect, phaseIIController.getPendingOnDutySubmissions);

router.post('/:id/on-duty/approve', protect, phaseIIController.approveOnDutySubmission);

router.post('/:id/on-duty/reject', protect, phaseIIController.rejectOnDutySubmission);

// General submission routes - comes after specific routes
router.post('/', protect, upload.fields([
  { name: 'geoTaggedPhoto', maxCount: 1 },
  { name: 'participationDocument', maxCount: 1 },
  { name: 'certificates', maxCount: 5 },
  { name: 'reportDocument', maxCount: 1 }
]), phaseIIController.createPhaseIISubmission);

router.get('/', protect, phaseIIController.getAllPhaseIISubmissions);

router.get('/:id', protect, phaseIIController.getPhaseIISubmissionById);

router.put('/:id', protect, phaseIIController.updatePhaseIISubmission);

router.delete('/:id', protect, phaseIIController.deletePhaseIISubmission);

router.put('/:id/status', protect, hasPermission(PERMISSIONS.APPROVAL_PHASE_II), phaseIIController.updatePhaseIIStatus);

router.get('/overdue', protect, (req, res) => {
  res.json({ status: 'success', message: 'Get overdue Phase II submissions - to be implemented', data: [] });
});

module.exports = router;
