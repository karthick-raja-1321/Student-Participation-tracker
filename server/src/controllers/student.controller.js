const Student = require('../models/Student');
const User = require('../models/User');
const PhaseISubmission = require('../models/PhaseISubmission');
const PhaseIISubmission = require('../models/PhaseIISubmission');
const EventRegistration = require('../models/EventRegistration');
const Event = require('../models/Event');
// Ensure Faculty model is registered for population
require('../models/Faculty');

// Get all students
exports.getAllStudents = async (req, res, next) => {
  try {
    const { departmentId, year, section, search } = req.query;
    const filter = {};
    
    // Filter out inactive students (soft-deleted)
    filter.isActive = { $ne: false };
    
    // Department-based filtering (guard against missing req.user)
    const userRole = req.user?.role;
    const userDept = req.user?.departmentId;
    
    // SUPER_ADMIN can see all students
    if (userRole === 'SUPER_ADMIN') {
      // No department filter - see everything
      if (departmentId) filter.departmentId = departmentId;
    } else if (userRole === 'HOD' || userRole === 'FACULTY') {
      if (userDept) filter.departmentId = userDept;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }
    
    if (year) filter.year = year;
    if (section) filter.section = section;
    
    // Search by roll number
    if (search && search.trim()) {
      filter.rollNumber = { $regex: search.trim(), $options: 'i' };
    }
    
    const students = await Student.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .populate('departmentId', 'name code')
      .populate('advisorId', 'userId')
      .populate('mentorId', 'userId')
      .sort({ year: 1, section: 1, rollNumber: 1 });
    
    res.json({
      status: 'success',
      data: { students },
    });
  } catch (error) {
    next(error);
  }
};

// Get student by ID
exports.getStudentById = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate('departmentId', 'name code')
      .populate('classAdvisorId')
      .populate('mentorId');
    
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found',
      });
    }
    
    res.json({
      status: 'success',
      data: { student },
    });
  } catch (error) {
    next(error);
  }
};

// Create student
exports.createStudent = async (req, res, next) => {
  try {
    const { userData, studentData } = req.body;
    
    // Validate section against department's numberOfSections
    if (studentData.departmentId && studentData.section) {
      const Department = require('../models/Department');
      const department = await Department.findById(studentData.departmentId);
      
      if (department) {
        const sectionIndex = studentData.section.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        const maxSections = department.numberOfSections || 3;
        
        if (sectionIndex < 0 || sectionIndex >= maxSections) {
          const validSections = Array.from({ length: maxSections }, (_, i) => 
            String.fromCharCode(65 + i)
          ).join(', ');
          
          return res.status(400).json({
            status: 'error',
            message: `Invalid section '${studentData.section}' for ${department.name}. Valid sections: ${validSections}`
          });
        }
      }
    }
    
    // Set default password
    const defaultPassword = 'Password123';
    
    // Create user first
    const user = await User.create({
      ...userData,
      password: defaultPassword,
      role: 'STUDENT',
    });
    
    // Create student record
    const student = await Student.create({
      ...studentData,
      userId: user._id,
    });
    
    const populatedStudent = await Student.findById(student._id)
      .populate('userId', 'firstName lastName email phone')
      .populate('departmentId', 'name code');
    
    res.status(201).json({
      status: 'success',
      data: { student: populatedStudent },
      message: 'Student created with default password: Password123',
    });
  } catch (error) {
    next(error);
  }
};

// Update student
exports.updateStudent = async (req, res, next) => {
  try {
    // Validate section against department's numberOfSections if section or departmentId is being updated
    if (req.body.section || req.body.departmentId) {
      const Department = require('../models/Department');
      const currentStudent = await Student.findById(req.params.id);
      
      if (!currentStudent) {
        return res.status(404).json({
          status: 'error',
          message: 'Student not found',
        });
      }
      
      const departmentId = req.body.departmentId || currentStudent.departmentId;
      const section = req.body.section || currentStudent.section;
      
      const department = await Department.findById(departmentId);
      
      if (department) {
        const sectionIndex = section.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        const maxSections = department.numberOfSections || 3;
        
        if (sectionIndex < 0 || sectionIndex >= maxSections) {
          const validSections = Array.from({ length: maxSections }, (_, i) => 
            String.fromCharCode(65 + i)
          ).join(', ');
          
          return res.status(400).json({
            status: 'error',
            message: `Invalid section '${section}' for ${department.name}. Valid sections: ${validSections}`
          });
        }
      }
    }
    
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phone')
     .populate('departmentId', 'name code');
    
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found',
      });
    }
    
    res.json({
      status: 'success',
      data: { student },
    });
  } catch (error) {
    next(error);
  }
};

// Delete student
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found',
      });
    }
    
    // SUPER_ADMIN can permanently delete, others just deactivate
    if (req.user.role === 'SUPER_ADMIN') {
      await Student.findByIdAndDelete(req.params.id);
      if (student.userId) {
        await User.findByIdAndDelete(student.userId);
      }
    } else {
      // Deactivate both student and user records
      await Student.findByIdAndUpdate(req.params.id, { isActive: false });
      if (student.userId) {
        await User.findByIdAndUpdate(student.userId, { isActive: false });
      }
    }
    
    res.json({
      status: 'success',
      message: 'Student deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get student dashboard statistics
exports.getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user.studentId;
    
    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Student ID is required'
      });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    // Get registration count
    const totalEvents = await EventRegistration.countDocuments({ studentId });

    // Get Phase I submissions count
    const phaseISubmissions = await PhaseISubmission.countDocuments({ studentId });

    // Get Phase II submissions count  
    const phaseIISubmissions = await PhaseIISubmission.countDocuments({ studentId });

    // Get approved submissions count
    const approvedSubmissions = await PhaseIISubmission.countDocuments({
      studentId,
      status: 'APPROVED'
    });

    // Get prizes/achievements count
    const prizesWon = await PhaseIISubmission.countDocuments({
      studentId,
      status: 'APPROVED',
      achievementType: { $in: ['First Prize', 'Second Prize', 'Third Prize', 'Winner'] }
    });

    // Get on-duty balance
    const onDutyBalance = student.onDuty || { totalAllowed: 7, availed: 0, balance: 7 };

    // Get recent submissions with full details
    const recentSubmissions = await PhaseIISubmission.find({ studentId })
      .populate('eventId', 'title startDate endDate')
      .populate('phaseISubmissionId', 'advisorId mentorId')
      .sort({ submittedAt: -1 })
      .limit(5);

    res.json({
      status: 'success',
      data: {
        stats: {
          totalEvents,
          submissions: phaseIISubmissions,
          approved: approvedSubmissions,
          prizesWon
        },
        onDuty: onDutyBalance,
        recentSubmissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get student's submission tracking details
exports.getSubmissionTracking = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const studentId = req.user.studentId;

    const submission = await PhaseIISubmission.findOne({
      _id: submissionId,
      studentId
    })
      .populate('eventId', 'title startDate endDate location')
      .populate({
        path: 'phaseISubmissionId',
        populate: [
          { path: 'advisorId', select: 'userId', populate: { path: 'userId', select: 'firstName lastName email' } },
          { path: 'mentorId', select: 'userId', populate: { path: 'userId', select: 'firstName lastName email' } }
        ]
      })
      .populate('onDutyApproverId', 'userId')
      .populate('approvedBy', 'firstName lastName email role');

    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found'
      });
    }

    // Get student details
    const student = await Student.findById(studentId)
      .populate('userId', 'firstName lastName email')
      .populate('departmentId', 'name code');

    // Get HOD details
    const hodUser = await User.findOne({ 
      role: 'HOD',
      departmentId: student.departmentId
    });

    // Build approval stages
    const approvalStages = [
      {
        stage: 'Phase I Submission',
        status: submission.phaseISubmissionId ? 'COMPLETED' : 'PENDING',
        completedAt: submission.phaseISubmissionId?.submittedAt
      },
      {
        stage: 'Phase II Submission',
        status: submission.submittedAt ? 'COMPLETED' : 'PENDING',
        completedAt: submission.submittedAt
      }
    ];

    // Add on-duty approval stage if applicable
    if (submission.isOnDuty) {
      approvalStages.push({
        stage: 'On-Duty Approval (HOD)',
        status: submission.onDutyApprovalStatus,
        completedAt: submission.onDutyApprovalStatus === 'APPROVED' ? submission.approvedAt : null,
        approvedBy: submission.onDutyApproverId
      });
    }

    // Add final approval stage
    approvalStages.push({
      stage: 'Final Approval',
      status: submission.status,
      completedAt: submission.approvedAt,
      approvedBy: submission.approvedBy
    });

    res.json({
      status: 'success',
      data: {
        submission,
        student,
        hod: hodUser,
        approvalStages,
        isOnDuty: submission.isOnDuty,
        onDutyApprovalStatus: submission.onDutyApprovalStatus
      }
    });
  } catch (error) {
    next(error);
  }
};

// Generate OD Approval Receipt PDF data
exports.generateODReceipt = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const studentId = req.user.studentId;

    const submission = await PhaseIISubmission.findOne({
      _id: submissionId,
      studentId,
      isOnDuty: true,
      onDutyApprovalStatus: 'APPROVED'
    })
      .populate('eventId', 'title startDate endDate location eventType')
      .populate({
        path: 'phaseISubmissionId',
        populate: [
          { path: 'advisorId', populate: { path: 'userId', select: 'firstName lastName email' } },
          { path: 'mentorId', populate: { path: 'userId', select: 'firstName lastName email' } }
        ]
      })
      .populate({
        path: 'onDutyApproverId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      });

    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Approved on-duty submission not found'
      });
    }

    const student = await Student.findById(studentId)
      .populate('userId', 'firstName lastName email')
      .populate('departmentId', 'name code');

    // Get HOD details
    const hodUser = await User.findOne({ 
      role: 'HOD',
      departmentId: student.departmentId
    });

    // Generate receipt data (frontend will convert to PDF)
    const receiptData = {
      student: {
        name: `${student.userId.firstName} ${student.userId.lastName}`,
        rollNumber: student.rollNumber,
        year: student.year,
        section: student.section,
        department: student.departmentId.name,
        email: student.userId.email
      },
      event: {
        title: submission.eventId.title,
        type: submission.eventId.eventType,
        startDate: submission.eventId.startDate,
        endDate: submission.eventId.endDate,
        location: submission.eventId.location
      },
      advisor: submission.phaseISubmissionId?.advisorId ? {
        name: `${submission.phaseISubmissionId.advisorId.userId.firstName} ${submission.phaseISubmissionId.advisorId.userId.lastName}`,
        email: submission.phaseISubmissionId.advisorId.userId.email
      } : null,
      mentor: submission.phaseISubmissionId?.mentorId ? {
        name: `${submission.phaseISubmissionId.mentorId.userId.firstName} ${submission.phaseISubmissionId.mentorId.userId.lastName}`,
        email: submission.phaseISubmissionId.mentorId.userId.email
      } : null,
      hod: hodUser ? {
        name: `${hodUser.firstName} ${hodUser.lastName}`,
        email: hodUser.email
      } : null,
      approval: {
        approvedAt: submission.approvedAt,
        remarks: submission.remarks,
        submissionId: submission._id
      },
      onDutyBalance: {
        availed: student.onDuty.availed,
        balance: student.onDuty.balance,
        totalAllowed: student.onDuty.totalAllowed
      }
    };

    res.json({
      status: 'success',
      data: receiptData
    });
  } catch (error) {
    next(error);
  }
};
