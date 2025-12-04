const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const registrationController = require('../controllers/registration.controller');

router.post('/', protect, registrationController.createRegistration);

router.get('/', protect, registrationController.getAllRegistrations);

router.get('/:id', protect, registrationController.getRegistrationById);

router.put('/:id', protect, registrationController.updateRegistration);

module.exports = router;
