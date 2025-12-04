const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');
const PhaseISubmission = require('../models/PhaseISubmission');

// Get all registrations
exports.getAllRegistrations = async (req, res, next) => {
  try {
    const { eventId, studentId } = req.query;
    const filter = {};
    
    if (eventId) filter.eventId = eventId;
    if (studentId) filter.studentId = studentId;
    
    const registrations = await EventRegistration.find(filter)
      .populate('eventId', 'title eventType startDate')
      .populate('studentId', 'userId registerNumber')
      .populate('teamMembers', 'userId registerNumber')
      .sort({ createdAt: -1 });
    
    res.json({
      status: 'success',
      data: { registrations },
    });
  } catch (error) {
    next(error);
  }
};

// Create registration (Phase I)
exports.createRegistration = async (req, res, next) => {
  try {
    const registration = await EventRegistration.create(req.body);
    
    // Create Phase I submission automatically
    const phaseISubmission = await PhaseISubmission.create({
      eventId: registration.eventId,
      studentId: registration.studentId,
      registrationId: registration._id,
      status: 'PENDING',
      submittedAt: new Date(),
    });
    
    // Update event participant count
    await Event.findByIdAndUpdate(registration.eventId, {
      $inc: { currentParticipants: registration.registrationType === 'TEAM' ? registration.teamMembers.length : 1 },
    });
    
    const populatedRegistration = await EventRegistration.findById(registration._id)
      .populate('eventId', 'title eventType startDate')
      .populate('studentId', 'userId registerNumber');
    
    res.status(201).json({
      status: 'success',
      data: { 
        registration: populatedRegistration,
        phaseISubmission,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get registration by ID
exports.getRegistrationById = async (req, res, next) => {
  try {
    const registration = await EventRegistration.findById(req.params.id)
      .populate('eventId')
      .populate('studentId')
      .populate('teamMembers');
    
    if (!registration) {
      return res.status(404).json({
        status: 'error',
        message: 'Registration not found',
      });
    }
    
    res.json({
      status: 'success',
      data: { registration },
    });
  } catch (error) {
    next(error);
  }
};

// Update registration
exports.updateRegistration = async (req, res, next) => {
  try {
    const registration = await EventRegistration.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('eventId', 'title eventType')
     .populate('studentId', 'userId registerNumber');
    
    if (!registration) {
      return res.status(404).json({
        status: 'error',
        message: 'Registration not found',
      });
    }
    
    res.json({
      status: 'success',
      data: { registration },
    });
  } catch (error) {
    next(error);
  }
};
