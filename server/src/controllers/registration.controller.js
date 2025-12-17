const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');
const PhaseISubmission = require('../models/PhaseISubmission');
const { notifySubmissionCreated, notifyMentorSelection } = require('../services/notification.service');

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
    const { eventId, studentId } = req.body;
    
    // Check if registration already exists
    let registration = await EventRegistration.findOne({ eventId, studentId });
    let isNewRegistration = false;
    
    if (registration) {
      // Update existing registration with new data
      registration = await EventRegistration.findByIdAndUpdate(
        registration._id,
        req.body,
        { new: true, runValidators: true }
      );
    } else {
      // Create new registration
      registration = await EventRegistration.create(req.body);
      isNewRegistration = true;
      
      // Update event participant count only for new registrations
      await Event.findByIdAndUpdate(registration.eventId, {
        $inc: { currentParticipants: registration.participationType === 'TEAM' ? registration.teamMembers.length : 1 },
      });
    }
    
    // Check if Phase I submission already exists
    let phaseISubmission = await PhaseISubmission.findOne({
      eventId: registration.eventId,
      studentId: registration.studentId,
    });
    
    if (!phaseISubmission) {
      // Get event and student details
      const event = await Event.findById(registration.eventId);
      const Student = require('../models/Student');
      const student = await Student.findById(registration.studentId);
      
      console.log('Student data:', {
        id: student._id,
        rollNumber: student.rollNumber,
        advisorId: student.advisorId,
        mentorId: student.mentorId,
        mentorOverride: req.body.mentorId
      });
      
      // Prefer mentorId provided by the student during submission; fall back to stored mentorId
      const chosenMentorId = req.body.mentorId || student.mentorId;
      if (!chosenMentorId) {
        return res.status(400).json({
          status: 'error',
          message: 'Please select a mentor before submitting your On-Duty request.'
        });
      }

      // Persist chosen mentor on the student record for future submissions
      if (!student.mentorId || student.mentorId.toString() !== chosenMentorId.toString()) {
        student.mentorId = chosenMentorId;
        await student.save();
      }
      
      // Check if student has advisor assigned
      if (!student.advisorId) {
        return res.status(400).json({
          status: 'error',
          message: 'Student must have an advisor assigned before submitting. Please contact your administrator.'
        });
      }
      
      // Create Phase I submission with required fields
      phaseISubmission = await PhaseISubmission.create({
        eventId: registration.eventId,
        studentId: registration.studentId,
        registrationId: registration._id,
        departmentId: student.departmentId,
        eventDetails: {
          eventName: event.title,
          venue: event.venue || 'TBD',
          startDate: event.startDate,
          endDate: event.endDate,
          organizerName: event.organizer || 'TBD'
        },
        teamName: registration.teamName,
        teamMembers: registration.teamMembers,
        advisorId: student.advisorId._id || student.advisorId,
        mentorId: chosenMentorId,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        isDraft: false
      });
      
      // Notify approvers about new submission
      await notifySubmissionCreated(phaseISubmission, event, student, event.departmentId);

      // Notify the chosen mentor with team + event details
      const mentorUserId = (await require('../models/Faculty').findById(chosenMentorId).select('userId'))?.userId;
      await notifyMentorSelection({
        mentorUserId,
        student,
        event,
        registration
      });
    }
    
    const populatedRegistration = await EventRegistration.findById(registration._id)
      .populate('eventId', 'title eventType startDate')
      .populate('studentId', 'userId registerNumber');
    
    res.status(isNewRegistration ? 201 : 200).json({
      status: 'success',
      message: isNewRegistration ? 'Registration created successfully' : 'Registration updated successfully',
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
