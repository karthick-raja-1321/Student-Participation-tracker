const PhaseISubmission = require('../models/PhaseISubmission');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Event = require('../models/Event');
const { APPROVAL_SEQUENCE } = require('../config/constants');
const {
  notifyMentorDecision,
  notifyNextApprover,
  notifyStageApproval,
  notifyFinalApproval
} = require('../services/enhancedNotification.service');

/**
 * Process approval/rejection at any stage in the hierarchy
 */
const processApproval = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { stage, approved, comments } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!APPROVAL_SEQUENCE.includes(stage)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid approval stage'
      });
    }

    if (typeof approved !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'Approval decision (approved: true/false) is required'
      });
    }

    // Get submission with populated references
    const submission = await PhaseISubmission.findById(submissionId)
      .populate('studentId')
      .populate('eventId')
      .populate('mentorId')
      .populate('advisorId')
      .populate('innovationCoordinatorId')
      .populate('hodId');

    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found'
      });
    }

    // Check if submission is at the correct stage
    if (submission.currentApprovalStage !== stage) {
      return res.status(400).json({
        status: 'error',
        message: `Submission is at ${submission.currentApprovalStage} stage, cannot process ${stage} approval`
      });
    }

    // Verify user has permission to approve at this stage
    const hasPermission = await verifyApprovalPermission(userId, submission, stage);
    if (!hasPermission) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to approve at this stage'
      });
    }

    // Verify HoD role for HOD stage approval/rejection
    if (stage === 'HOD' && req.user.role !== 'HOD') {
      return res.status(403).json({
        status: 'error',
        message: 'Only HOD can approve or reject at HOD stage'
      });
    }

    // Update approval fields based on stage
    const approvalField = `${stage.toLowerCase()}Approval`;
    const now = new Date();

    submission[approvalField] = {
      approved,
      approvedAt: now,
      comments: comments || '',
      notifiedAt: now
    };

    // Add to timeline
    submission.approvalTimeline.push({
      stage,
      action: approved ? 'APPROVED' : 'REJECTED',
      actionBy: userId,
      actionAt: now,
      comments: comments || ''
    });

    // Get approver name for notifications
    const faculty = await Faculty.findOne({ userId }).populate('userId', 'firstName lastName');
    const approverName = faculty?.userId 
      ? `${faculty.userId.firstName} ${faculty.userId.lastName}`
      : 'Approver';

    if (approved) {
      // Move to next stage if approved
      const currentIndex = APPROVAL_SEQUENCE.indexOf(stage);
      
      if (currentIndex === APPROVAL_SEQUENCE.length - 1) {
        // Final stage - mark as completed
        submission.currentApprovalStage = 'COMPLETED';
        submission.status = 'APPROVED';
        submission.isDraft = false;

        // Notify student of final approval
        await notifyFinalApproval({
          studentUserId: submission.studentId.userId,
          event: submission.eventId,
          approved: true
        });
      } else {
        // Move to next stage
        const nextStage = APPROVAL_SEQUENCE[currentIndex + 1];
        submission.currentApprovalStage = nextStage;

        // Notify next approver
        await notifyNextApprover({
          submission,
          currentStage: stage,
          student: submission.studentId,
          event: submission.eventId
        });
      }

      // Notify student of this stage's approval
      await notifyStageApproval({
        studentUserId: submission.studentId.userId,
        stage,
        approverName,
        approved: true,
        event: submission.eventId,
        comments
      });

    } else {
      // Rejection handling - HoD and other stages can reject with proper permissions
      submission.status = 'REVISION_REQUESTED';
      
      // Special handling for mentor rejection - allow re-selection
      if (stage === 'MENTOR') {
        submission.currentApprovalStage = 'MENTOR'; // Stay at mentor stage
        submission.mentorId = null; // Clear mentor so student can select new one
        
        await notifyMentorDecision({
          studentUserId: submission.studentId.userId,
          mentorName: approverName,
          approved: false,
          event: submission.eventId,
          comments
        });
      } else {
        // Other stages including HOD - allow revision and resubmission
        submission.currentApprovalStage = stage;
        
        // Notify student of rejection with revision request
        await notifyStageApproval({
          studentUserId: submission.studentId.userId,
          stage,
          approverName,
          approved: false,
          event: submission.eventId,
          comments
        });

        // Notify HoD if IC rejects, or notify IC if HoD rejects
        if (stage === 'INNOVATION_COORDINATOR') {
          // IC rejected - notify HoD
          if (submission.hodId) {
            const hod = await Faculty.findById(submission.hodId).select('userId');
            if (hod?.userId) {
              await require('../services/enhancedNotification.service').createNotification(
                hod.userId,
                'REJECTION',
                'Submission Rejected by Innovation Coordinator',
                `Innovation Coordinator rejected submission for "${submission.eventId?.title || 'event'}" from ${submission.studentId?.userId?.firstName || 'student'}. Comments: ${comments || 'None'}`,
                submission._id,
                'PhaseISubmission'
              );
            }
          }
        } else if (stage === 'HOD') {
          // HoD rejected - notify IC to allow them to take action if needed
          if (submission.innovationCoordinatorId) {
            const ic = await Faculty.findById(submission.innovationCoordinatorId).select('userId');
            if (ic?.userId) {
              await require('../services/enhancedNotification.service').createNotification(
                ic.userId,
                'REJECTION',
                'Submission Rejected by HoD - Student Resubmission Expected',
                `HoD rejected submission for "${submission.eventId?.title || 'event'}" from ${submission.studentId?.userId?.firstName || 'student'}. Comments: ${comments || 'None'}. Student needs to revise and resubmit.`,
                submission._id,
                'PhaseISubmission'
              );
            }
          }
        }
      }
    }

    await submission.save();

    res.status(200).json({
      status: 'success',
      data: {
        submission,
        message: approved ? 'Submission approved successfully' : 'Submission rejected'
      }
    });

  } catch (error) {
    console.error('Error processing approval:', error);
    next(error);
  }
};

/**
 * Verify if user has permission to approve at the given stage
 */
const verifyApprovalPermission = async (userId, submission, stage) => {
  try {
    const faculty = await Faculty.findOne({ userId });
    
    if (!faculty) return false;

    switch (stage) {
      case 'MENTOR':
        return submission.mentorId?.toString() === faculty._id.toString();
      
      case 'CLASS_ADVISOR':
        return submission.advisorId?.toString() === faculty._id.toString();
      
      case 'INNOVATION_COORDINATOR':
        return faculty.isInnovationCoordinator &&
               faculty.innovationCoordinatorFor?.some(
                 dept => dept.toString() === submission.departmentId?.toString()
               );
      
      case 'HOD':
        const user = await require('../models/User').findById(userId);
        return user.role === 'HOD' && 
               user.departmentId?.toString() === submission.departmentId?.toString();
      
      case 'PRINCIPAL':
        const principalUser = await require('../models/User').findById(userId);
        return principalUser.role === 'PRINCIPAL';
      
      default:
        return false;
    }
  } catch (error) {
    console.error('Error verifying approval permission:', error);
    return false;
  }
};

/**
 * Get submissions pending at user's approval stage
 */
const getPendingApprovals = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Determine user's role and approval stage
    const faculty = await Faculty.findOne({ userId });
    const user = await require('../models/User').findById(userId);
    
    let approvalStage = null;
    let query = {};

    if (faculty) {
      // Mentor
      if (faculty.isMentor) {
        approvalStage = 'MENTOR';
        query = {
          mentorId: faculty._id,
          currentApprovalStage: 'MENTOR',
          'mentorApproval.approved': null
        };
      }

      // Class Advisor
      if (faculty.isClassAdvisor) {
        approvalStage = 'CLASS_ADVISOR';
        query = {
          advisorId: faculty._id,
          currentApprovalStage: 'CLASS_ADVISOR',
          'classAdvisorApproval.approved': null
        };
      }

      // Innovation Coordinator
      if (faculty.isInnovationCoordinator) {
        approvalStage = 'INNOVATION_COORDINATOR';
        query = {
          departmentId: { $in: faculty.innovationCoordinatorFor },
          currentApprovalStage: 'INNOVATION_COORDINATOR',
          'innovationCoordinatorApproval.approved': null
        };
      }
    }

    // HoD
    if (user.role === 'HOD') {
      approvalStage = 'HOD';
      query = {
        departmentId: user.departmentId,
        currentApprovalStage: 'HOD',
        'hodApproval.approved': null
      };
    }

    // Principal
    if (user.role === 'PRINCIPAL') {
      approvalStage = 'PRINCIPAL';
      query = {
        currentApprovalStage: 'PRINCIPAL',
        'principalApproval.approved': null
      };
    }

    const submissions = await PhaseISubmission.find(query)
      .populate('studentId')
      .populate('eventId')
      .populate('mentorId')
      .populate('advisorId')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        approvalStage,
        count: submissions.length,
        submissions
      }
    });

  } catch (error) {
    console.error('Error getting pending approvals:', error);
    next(error);
  }
};

/**
 * Get submission approval history
 */
const getApprovalHistory = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    const submission = await PhaseISubmission.findById(submissionId)
      .populate('approvalTimeline.actionBy', 'firstName lastName email')
      .populate('studentId', 'userId registerNumber')
      .populate('eventId', 'title');

    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found'
      });
    }

    const history = {
      submissionId: submission._id,
      student: submission.studentId,
      event: submission.eventId,
      currentStage: submission.currentApprovalStage,
      status: submission.status,
      timeline: submission.approvalTimeline.map(entry => ({
        stage: entry.stage,
        action: entry.action,
        actionBy: entry.actionBy,
        actionAt: entry.actionAt,
        comments: entry.comments
      })),
      approvals: {
        mentor: submission.mentorApproval,
        classAdvisor: submission.classAdvisorApproval,
        innovationCoordinator: submission.innovationCoordinatorApproval,
        hod: submission.hodApproval,
        principal: submission.principalApproval
      }
    };

    res.status(200).json({
      status: 'success',
      data: { history }
    });

  } catch (error) {
    console.error('Error getting approval history:', error);
    next(error);
  }
};

module.exports = {
  processApproval,
  getPendingApprovals,
  getApprovalHistory,
  verifyApprovalPermission
};
