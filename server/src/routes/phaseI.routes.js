const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { hasPermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/constants');
const upload = require('../middleware/upload');
const phaseIController = require('../controllers/phaseI.controller');

router.post('/', protect, upload.fields([
  { name: 'selectionProof', maxCount: 1 },
  { name: 'paymentProof', maxCount: 1 },
  { name: 'odRequestForm', maxCount: 1 }
]), (req, res) => {
  res.json({ status: 'success', message: 'Phase I submission - to be implemented' });
});

router.get('/', protect, phaseIController.getAllPhaseISubmissions);

router.get('/:id', protect, phaseIController.getPhaseISubmissionById);

router.put('/:id', protect, phaseIController.updatePhaseISubmission);

router.delete('/:id', protect, phaseIController.deletePhaseISubmission);

router.put('/:id/status', protect, hasPermission(
  PERMISSIONS.APPROVAL_PHASE_I_MENTOR,
  PERMISSIONS.APPROVAL_PHASE_I_ADVISOR,
  PERMISSIONS.APPROVAL_PHASE_I_HOD
), phaseIController.updatePhaseIStatus);

module.exports = router;
