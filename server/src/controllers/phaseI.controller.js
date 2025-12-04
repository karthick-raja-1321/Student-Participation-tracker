const PhaseISubmission = require('../models/PhaseISubmission');

// Get all Phase I submissions
exports.getAllPhaseISubmissions = async (req, res, next) => {
  try {
    const { status, eventId, studentId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (eventId) filter.eventId = eventId;
    if (studentId) filter.studentId = studentId;
    
    // Filter based on role
    // SUPER_ADMIN and HOD can see all submissions
    if (req.user.role === 'STUDENT') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        filter.studentId = student._id;
      }
    }
    
    const submissions = await PhaseISubmission.find(filter)
      .populate('eventId', 'title eventType startDate')
      .populate('studentId', 'userId registerNumber')
      .populate('registrationId')
      .sort({ submittedAt: -1 });
    
    res.json({
      status: 'success',
      data: { submissions },
    });
  } catch (error) {
    next(error);
  }
};

// Get Phase I submission by ID
exports.getPhaseISubmissionById = async (req, res, next) => {
  try {
    const submission = await PhaseISubmission.findById(req.params.id)
      .populate('eventId')
      .populate('studentId')
      .populate('registrationId')
      .populate('approvedBy', 'firstName lastName');
    
    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found',
      });
    }
    
    res.json({
      status: 'success',
      data: { submission },
    });
  } catch (error) {
    next(error);
  }
};

// Update Phase I submission status
exports.updatePhaseIStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    
    const submission = await PhaseISubmission.findByIdAndUpdate(
      req.params.id,
      {
        status,
        remarks,
        approvedBy: req.user._id,
        approvedAt: status === 'APPROVED' ? new Date() : undefined,
      },
      { new: true }
    ).populate('eventId', 'title')
     .populate('studentId', 'userId');
    
    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found',
      });
    }
    
    res.json({
      status: 'success',
      data: { submission },
      message: `Submission ${status.toLowerCase()} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Update Phase I submission
exports.updatePhaseISubmission = async (req, res, next) => {
  try {
    const submission = await PhaseISubmission.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('eventId')
     .populate('studentId');
    
    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found',
      });
    }
    
    res.json({
      status: 'success',
      data: { submission },
      message: 'Submission updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Delete Phase I submission
exports.deletePhaseISubmission = async (req, res, next) => {
  try {
    const submission = await PhaseISubmission.findByIdAndDelete(req.params.id);
    
    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found',
      });
    }
    
    res.json({
      status: 'success',
      message: 'Submission deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

