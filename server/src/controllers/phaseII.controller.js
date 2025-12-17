const PhaseIISubmission = require('../models/PhaseIISubmission');
const PhaseISubmission = require('../models/PhaseISubmission');
const Event = require('../models/Event');
const { notifySubmissionCreated, notifyApprovalStatus, getApprovalProgress } = require('../services/notification.service');

// Get all Phase II submissions
exports.getAllPhaseIISubmissions = async (req, res, next) => {
  try {
    const { status, eventId, studentId } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (eventId) filter.eventId = eventId;
    if (studentId) filter.studentId = studentId;
    
    // Filter based on role
    if (req.user.role === 'STUDENT') {
      const Student = require('../models/Student');
      const student = await Student.findOne({ userId: req.user._id });
      if (student) {
        filter.studentId = student._id;
      }
    } else if (req.user.role === 'FACULTY') {
      // For FACULTY role: check if class advisor or innovation coordinator
      const Faculty = require('../models/Faculty');
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty) {
        return res.status(403).json({
          status: 'error',
          message: 'Faculty record not found',
        });
      }
      
      // Class Advisors can only see their assigned students' submissions
      if (faculty.isClassAdvisor) {
        // Get all students advised by this faculty
        const Student = require('../models/Student');
        const advisedStudents = await Student.find({ advisorId: faculty._id }).select('_id');
        const studentIds = advisedStudents.map(s => s._id);
        filter.studentId = { $in: studentIds };
      }
      // Innovation Coordinators see all department submissions
      else if (faculty.isInnovationCoordinator) {
        filter.departmentId = faculty.departmentId;
      } else {
        // Faculty without specific role cannot see submissions
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to view submissions',
        });
      }
    } else if (req.user.role === 'HOD') {
      // HOD can see all submissions from their department
      const Faculty = require('../models/Faculty');
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (faculty) {
        filter.departmentId = faculty.departmentId;
      }
    }
    // SUPER_ADMIN can see all submissions (no filter)
    
    const submissions = await PhaseIISubmission.find(filter)
      .populate('eventId', 'title eventType')
      .populate('studentId', 'userId registerNumber')
      .populate('phaseISubmissionId')
      .populate('approvedBy', 'firstName lastName')
      .sort({ submittedAt: -1 });
    
    res.json({
      status: 'success',
      data: { submissions },
    });
  } catch (error) {
    next(error);
  }
};

// Create Phase II submission
exports.createPhaseIISubmission = async (req, res, next) => {
  try {
    const submission = await PhaseIISubmission.create({
      ...req.body,
      submittedAt: new Date(),
    });
    
    // Update Phase I submission to mark as completed
    await PhaseISubmission.findByIdAndUpdate(req.body.phaseISubmissionId, {
      phaseIICompleted: true,
    });
    
    const populatedSubmission = await PhaseIISubmission.findById(submission._id)
      .populate('eventId', 'title')
      .populate('studentId', 'userId registerNumber');
    
    // Get event and student details for notification
    const event = await Event.findById(submission.eventId);
    const Student = require('../models/Student');
    const student = await Student.findById(submission.studentId).populate('userId');
    
    // Notify approvers about new submission
    await notifySubmissionCreated(submission, event, student, event.departmentId);
    
    res.status(201).json({
      status: 'success',
      data: { submission: populatedSubmission },
    });
  } catch (error) {
    next(error);
  }
};

// Get Phase II submission by ID
exports.getPhaseIISubmissionById = async (req, res, next) => {
  try {
    const submission = await PhaseIISubmission.findById(req.params.id)
      .populate('eventId')
      .populate('studentId')
      .populate('phaseISubmissionId')
      .populate('approvedBy', 'firstName lastName');
    
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

// Update Phase II submission status
exports.updatePhaseIIStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    
    const submission = await PhaseIISubmission.findById(req.params.id)
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
    
    const updatedSubmission = await PhaseIISubmission.findByIdAndUpdate(
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

// Update Phase II submission
exports.updatePhaseIISubmission = async (req, res, next) => {
  try {
    const submission = await PhaseIISubmission.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
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
    });
  } catch (error) {
    next(error);
  }
};

// Get pending on-duty submissions for approval by HOD/Innovation Coordinator
exports.getPendingOnDutySubmissions = async (req, res, next) => {
  try {
    const { departmentId, page = 1, limit = 10 } = req.query;
    const Student = require('../models/Student');
    const Faculty = require('../models/Faculty');
    
    // Get HOD's or Innovation Coordinator's department
    let dept = departmentId;
    if (!dept) {
      const faculty = await Faculty.findOne({ userId: req.user._id });
      if (!faculty) {
        return res.status(403).json({
          status: 'error',
          message: 'Faculty profile not found',
        });
      }
      dept = faculty.departmentId;
    }
    
    // Find all on-duty submissions pending approval for this department
    const skip = (page - 1) * limit;
    
    const submissions = await PhaseIISubmission.find({
      isOnDuty: true,
      onDutyApprovalStatus: 'PENDING'
    })
      .populate({
        path: 'studentId',
        select: 'userId rollNumber year section departmentId onDuty',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      })
      .populate('eventId', 'title eventType')
      .populate({
        path: 'phaseISubmissionId',
        select: 'hoursSpent certificateObtained'
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ submittedAt: -1 });
    
    // Filter by department
    const filtered = submissions.filter(sub => 
      sub.studentId && sub.studentId.departmentId.toString() === dept.toString()
    );
    
    const total = await PhaseIISubmission.countDocuments({
      isOnDuty: true,
      onDutyApprovalStatus: 'PENDING'
    });
    
    res.json({
      status: 'success',
      data: {
        submissions: filtered,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Approve on-duty submission and reduce student balance
exports.approveOnDutySubmission = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const Faculty = require('../models/Faculty');
    const Student = require('../models/Student');
    
    // Get submission with student data
    const submission = await PhaseIISubmission.findById(req.params.id)
      .populate('studentId')
      .populate('eventId', 'title');
    
    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found',
      });
    }
    
    if (submission.onDutyApprovalStatus !== 'PENDING') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot approve submission with status: ${submission.onDutyApprovalStatus}`,
      });
    }
    
    // Get current user's faculty record
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      return res.status(403).json({
        status: 'error',
        message: 'Faculty profile not found',
      });
    }
    
    // Verify HOD or Innovation Coordinator from same department
    if (req.user.role === 'HOD') {
      const hodFaculty = await Faculty.findOne({ 
        userId: req.user._id,
        departmentId: submission.studentId.departmentId
      });
      if (!hodFaculty) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to approve submissions from this department',
        });
      }
    } else if (faculty.isInnovationCoordinator) {
      if (!faculty.departmentId.equals(submission.studentId.departmentId)) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to approve submissions from this department',
        });
      }
    } else {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to approve on-duty submissions',
      });
    }
    
    // Update submission status
    submission.onDutyApprovalStatus = 'APPROVED';
    submission.onDutyApproverId = faculty._id;
    submission.status = 'APPROVED';
    submission.phaseIIStatus = 'APPROVED';
    submission.approvedBy = req.user._id;
    submission.approvedAt = new Date();
    if (remarks) {
      submission.remarks = remarks;
    }
    await submission.save();
    
    // Update student on-duty balance
    const student = await Student.findById(submission.studentId._id);
    if (student) {
      // Increment availed and decrement balance
      student.onDuty.availed = (student.onDuty.availed || 0) + 1;
      student.onDuty.balance = student.onDuty.totalAllowed - student.onDuty.availed;
      student.onDuty.lastUpdated = new Date();
      await student.save();
    }
    
    const updatedSubmission = await PhaseIISubmission.findById(submission._id)
      .populate({
        path: 'studentId',
        select: 'userId rollNumber year section onDuty',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      })
      .populate('eventId', 'title')
      .populate('onDutyApproverId', 'firstName lastName employeeId');
    
    res.json({
      status: 'success',
      data: {
        submission: updatedSubmission,
        studentUpdate: {
          onDutyAvailed: student.onDuty.availed,
          onDutyBalance: student.onDuty.balance,
          totalAllowed: student.onDuty.totalAllowed
        }
      },
      message: 'On-duty submission approved successfully and student balance updated'
    });
  } catch (error) {
    next(error);
  }
};

// Reject on-duty submission
exports.rejectOnDutySubmission = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const Faculty = require('../models/Faculty');
    const Student = require('../models/Student');
    
    // Get submission with student data
    const submission = await PhaseIISubmission.findById(req.params.id)
      .populate('studentId')
      .populate('eventId', 'title');
    
    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found',
      });
    }
    
    if (submission.onDutyApprovalStatus !== 'PENDING') {
      return res.status(400).json({
        status: 'error',
        message: `Cannot reject submission with status: ${submission.onDutyApprovalStatus}`,
      });
    }
    
    // Get current user's faculty record
    const faculty = await Faculty.findOne({ userId: req.user._id });
    if (!faculty) {
      return res.status(403).json({
        status: 'error',
        message: 'Faculty profile not found',
      });
    }
    
    // Verify HOD or Innovation Coordinator from same department
    if (req.user.role === 'HOD') {
      const hodFaculty = await Faculty.findOne({ 
        userId: req.user._id,
        departmentId: submission.studentId.departmentId
      });
      if (!hodFaculty) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to reject submissions from this department',
        });
      }
    } else if (faculty.isInnovationCoordinator) {
      if (!faculty.departmentId.equals(submission.studentId.departmentId)) {
        return res.status(403).json({
          status: 'error',
          message: 'You are not authorized to reject submissions from this department',
        });
      }
    } else {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to reject on-duty submissions',
      });
    }
    
    // Update submission status
    submission.onDutyApprovalStatus = 'REJECTED';
    submission.onDutyApproverId = faculty._id;
    submission.status = 'REJECTED';
    submission.phaseIIStatus = 'REJECTED';
    submission.approvedBy = req.user._id;
    submission.approvedAt = new Date();
    if (remarks) {
      submission.remarks = remarks;
    }
    await submission.save();
    
    const updatedSubmission = await PhaseIISubmission.findById(submission._id)
      .populate({
        path: 'studentId',
        select: 'userId rollNumber year section onDuty',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      })
      .populate('eventId', 'title')
      .populate('onDutyApproverId', 'firstName lastName employeeId');
    
    res.json({
      status: 'success',
      data: { submission: updatedSubmission },
      message: 'On-duty submission rejected successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete Phase II submission
exports.deletePhaseIISubmission = async (req, res, next) => {
  try {
    const submission = await PhaseIISubmission.findByIdAndDelete(req.params.id);
    
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

