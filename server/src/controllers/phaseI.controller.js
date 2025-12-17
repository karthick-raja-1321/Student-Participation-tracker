const PhaseISubmission = require('../models/PhaseISubmission');
const Event = require('../models/Event');
const Student = require('../models/Student');
const { notifySubmissionCreated, notifyApprovalStatus, getApprovalProgress } = require('../services/notification.service');

// Get all Phase I submissions
exports.getAllPhaseISubmissions = async (req, res, next) => {
  try {
    const { status, eventId, studentId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (eventId) filter.eventId = eventId;
    if (studentId) filter.studentId = studentId;
    
    // Filter based on role
    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        filter.studentId = student._id;
      }
    } else if (req.user.role === 'FACULTY') {
      // For FACULTY role: check if class advisor, mentor, or innovation coordinator
      const Faculty = require('../models/Faculty');
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty) {
        return res.status(403).json({
          status: 'error',
          message: 'Faculty record not found',
        });
      }
      
      const studentIdSets = [];
      
      // Mentors can see submissions where they are assigned as mentor
      if (faculty.isMentor) {
        // Find submissions where this faculty is the mentor
        const mentorSubmissions = await PhaseISubmission.find({ mentorId: faculty._id }).select('studentId');
        const mentorStudentIds = mentorSubmissions.map(s => s.studentId.toString());
        if (mentorStudentIds.length > 0) {
          studentIdSets.push(mentorStudentIds);
        }
      }
      
      // Class Advisors can see their advised students' submissions
      if (faculty.isClassAdvisor) {
        // Get all students advised by this faculty
        const advisedStudents = await Student.find({ advisorId: faculty._id }).select('_id');
        const studentIds = advisedStudents.map(s => s._id.toString());
        if (studentIds.length > 0) {
          studentIdSets.push(studentIds);
        }
      }
      
      // Innovation Coordinators see submissions where they are assigned
      if (faculty.isInnovationCoordinator) {
        // Find submissions where this faculty is the innovation coordinator
        const icSubmissions = await PhaseISubmission.find({ innovationCoordinatorId: faculty._id }).select('studentId');
        const icStudentIds = icSubmissions.map(s => s.studentId.toString());
        if (icStudentIds.length > 0) {
          studentIdSets.push(icStudentIds);
        }
      }
      
      // Combine all student IDs
      if (studentIdSets.length > 0) {
        const allStudentIds = [...new Set(studentIdSets.flat())];
        filter.studentId = { $in: allStudentIds };
      } else if (!faculty.isClassAdvisor && !faculty.isInnovationCoordinator && !faculty.isMentor) {
        // If faculty has no specific role, deny access
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to view submissions',
        });
      } else {
        // Has role but no submissions yet
        filter.studentId = { $in: [] };
      }
    } else if (req.user.role === 'HOD') {
      // HOD can see all submissions from their department students
      const Faculty = require('../models/Faculty');
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (faculty) {
        const departmentStudents = await Student.find({ departmentId: faculty.departmentId }).select('_id');
        const studentIds = departmentStudents.map(s => s._id);
        filter.studentId = { $in: studentIds };
      }
    }
    // SUPER_ADMIN can see all submissions (no filter)
    
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
      .populate('registrationId');
    
    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found',
      });
    }
    
    // Get approval progress for students
    const approvalProgress = await getApprovalProgress(submission);
    
    res.json({
      status: 'success',
      data: { submission, approvalProgress },
    });
  } catch (error) {
    next(error);
  }
};

// Update Phase I submission status
exports.updatePhaseIStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    
    const submission = await PhaseISubmission.findById(req.params.id)
      .populate('studentId');
    
    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found',
      });
    }
    
    // Authorization check: Only class advisor of the student can approve
    if (req.user.role === 'FACULTY') {
      const Faculty = require('../models/Faculty');
      const faculty = await Faculty.findOne({ userId: req.user._id });
      
      // Class advisor can only approve their assigned students
      if (faculty.isClassAdvisor) {
        const student = submission.studentId;
        if (!student.advisorId || student.advisorId.toString() !== faculty._id.toString()) {
          return res.status(403).json({
            status: 'error',
            message: 'You can only approve submissions from your assigned students',
          });
        }
      }
    }
    
    const updatedSubmission = await PhaseISubmission.findByIdAndUpdate(
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
    
    // Notify student about approval status
    if (status === 'APPROVED' || status === 'REJECTED') {
      await notifyApprovalStatus(updatedSubmission, status, updatedSubmission.studentId, updatedSubmission.eventId);
    }
    
    res.json({
      status: 'success',
      data: { submission: updatedSubmission },
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

// Advisor approve/reject submission
exports.advisorApproval = async (req, res, next) => {
  try {
    const { approved, comments } = req.body;
    const Faculty = require('../models/Faculty');
    const Student = require('../models/Student');
    
    const submission = await PhaseISubmission.findById(req.params.id).populate('studentId');
    if (!submission) {
      return res.status(404).json({ status: 'error', message: 'Submission not found' });
    }
    
    const faculty = await Faculty.findOne({ userId: req.user._id });
    const student = await Student.findById(submission.studentId._id || submission.studentId);
    
    if (!faculty || !student.advisorId || student.advisorId.toString() !== faculty._id.toString()) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You are not the class advisor for this student' 
      });
    }
    
    // Check if mentor approved first
    if (!submission.mentorApproval || submission.mentorApproval.approved !== true) {
      return res.status(400).json({
        status: 'error',
        message: 'Mentor must approve first'
      });
    }
    
    submission.classAdvisorApproval = { approved, approvedAt: new Date(), comments };
    if (approved) {
      submission.currentApprovalStage = 'INNOVATION_COORDINATOR';
    }
    await submission.save();
    
    await notifyApprovalStatus(submission, approved ? 'APPROVED' : 'REJECTED', submission.studentId, submission.eventId);
    
    res.json({
      status: 'success',
      data: { submission },
      message: `Submission ${approved ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Mentor approve/reject submission (first in the chain)
exports.mentorApproval = async (req, res, next) => {
  try {
    const { approved, comments } = req.body;
    const Faculty = require('../models/Faculty');
    
    const submission = await PhaseISubmission.findById(req.params.id).populate('studentId');
    if (!submission) {
      return res.status(404).json({ status: 'error', message: 'Submission not found' });
    }
    
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty || submission.mentorId.toString() !== faculty._id.toString()) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You are not the mentor for this submission' 
      });
    }
    
    // Check if mentor has already approved
    if (submission.mentorApproval && submission.mentorApproval.approved !== null) {
      return res.status(400).json({
        status: 'error',
        message: 'Mentor has already reviewed this submission'
      });
    }
    
    // Check if this is the correct approval stage
    if (submission.currentApprovalStage !== 'MENTOR') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot approve at this stage. Current stage: ${submission.currentApprovalStage}`
      });
    }
    
    submission.mentorApproval = { approved, approvedAt: new Date(), comments };
    if (approved) {
      submission.currentApprovalStage = 'CLASS_ADVISOR';
    } else {
      submission.status = 'REJECTED';
    }
    await submission.save();
    
    await notifyApprovalStatus(submission, approved ? 'APPROVED' : 'REJECTED', submission.studentId, submission.eventId);
    
    res.json({
      status: 'success',
      data: { submission },
      message: `Submission ${approved ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    console.error('Mentor approval error:', error);
    next(error);
  }
};

// Innovation Coordinator approve/reject submission
exports.innovationCoordinatorApproval = async (req, res, next) => {
  try {
    const { approved, comments } = req.body;
    const Faculty = require('../models/Faculty');
    
    const submission = await PhaseISubmission.findById(req.params.id).populate('studentId');
    if (!submission) {
      return res.status(404).json({ status: 'error', message: 'Submission not found' });
    }
    
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty || submission.innovationCoordinatorId.toString() !== faculty._id.toString()) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'You are not the innovation coordinator for this submission' 
      });
    }
    
    // Check if mentor and advisor approved first
    if (!submission.mentorApproval || submission.mentorApproval.approved !== true) {
      return res.status(400).json({
        status: 'error',
        message: 'Mentor must approve first'
      });
    }
    
    if (!submission.classAdvisorApproval || submission.classAdvisorApproval.approved !== true) {
      return res.status(400).json({
        status: 'error',
        message: 'Class Advisor must approve first'
      });
    }
    
    submission.innovationCoordinatorApproval = { approved, approvedAt: new Date(), comments };
    if (approved) {
      submission.currentApprovalStage = 'HOD';
    }
    await submission.save();
    
    await notifyApprovalStatus(submission, approved ? 'APPROVED' : 'REJECTED', submission.studentId, submission.eventId);
    
    res.json({
      status: 'success',
      data: { submission },
      message: `Submission ${approved ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// HOD approve/reject submission
exports.hodApproval = async (req, res, next) => {
  try {
    const { approved, comments } = req.body;
    const Faculty = require('../models/Faculty');
    const User = require('../models/User');
    
    const submission = await PhaseISubmission.findById(req.params.id)
      .populate('studentId')
      .populate('eventId')
      .populate('departmentId');
    if (!submission) {
      return res.status(404).json({ status: 'error', message: 'Submission not found' });
    }
    
    // Check if user is HOD with matching department
    if (req.user.role !== 'HOD') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Only HOD can perform final approval' 
      });
    }
    
    // Verify HoD is from the same department as the submission
    const userDeptId = req.user.departmentId?.toString();
    const submissionDeptId = submission.departmentId?._id?.toString() || submission.departmentId?.toString();
    
    if (userDeptId !== submissionDeptId) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only approve submissions from your department'
      });
    }
    
    if (!submission.mentorApproval || submission.mentorApproval.approved !== true) {
      return res.status(400).json({
        status: 'error',
        message: 'Mentor must approve first'
      });
    }
    
    if (!submission.classAdvisorApproval || submission.classAdvisorApproval.approved !== true) {
      return res.status(400).json({
        status: 'error',
        message: 'Class Advisor must approve first'
      });
    }
    
    if (!submission.innovationCoordinatorApproval || submission.innovationCoordinatorApproval.approved !== true) {
      return res.status(400).json({
        status: 'error',
        message: 'Innovation Coordinator must approve first'
      });
    }
    
    submission.hodApproval = { approved, approvedAt: new Date(), comments };
    submission.status = approved ? 'APPROVED' : 'REJECTED';
    await submission.save();
    
    await notifyApprovalStatus(submission, approved ? 'APPROVED' : 'REJECTED', submission.studentId, submission.eventId);
    
    res.json({
      status: 'success',
      data: { submission },
      message: `Submission ${approved ? 'approved' : 'rejected'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};
