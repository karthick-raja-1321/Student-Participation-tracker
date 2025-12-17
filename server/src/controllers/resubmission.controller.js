const PhaseISubmission = require('../models/PhaseISubmission');
const { APPROVAL_SEQUENCE } = require('../config/constants');
const { notifyNextApprover } = require('../services/enhancedNotification.service');

/**
 * Allow student to modify and resubmit a rejected submission
 */
const resubmitRejectedSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { 
      eventDetails, 
      selectionProof, 
      paymentProof, 
      odRequestForm,
      teamName,
      teamMembers,
      comments 
    } = req.body;
    const userId = req.user._id;

    // Get submission
    const submission = await PhaseISubmission.findById(submissionId)
      .populate('studentId')
      .populate('eventId');

    if (!submission) {
      return res.status(404).json({
        status: 'error',
        message: 'Submission not found'
      });
    }

    // Verify the submission belongs to the student
    if (submission.studentId.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'You can only resubmit your own submissions'
      });
    }

    // Verify submission is in REVISION_REQUESTED status
    if (submission.status !== 'REVISION_REQUESTED') {
      return res.status(400).json({
        status: 'error',
        message: 'Only rejected submissions can be resubmitted'
      });
    }

    // Update submission with new data
    if (eventDetails) {
      submission.eventDetails = { ...submission.eventDetails, ...eventDetails };
    }
    if (selectionProof) {
      submission.selectionProof = selectionProof;
    }
    if (paymentProof) {
      submission.paymentProof = paymentProof;
    }
    if (odRequestForm) {
      submission.odRequestForm = odRequestForm;
    }
    if (teamName !== undefined) {
      submission.teamName = teamName;
    }
    if (teamMembers) {
      submission.teamMembers = teamMembers;
    }

    // Reset the approval at the stage that rejected
    const rejectedStage = submission.currentApprovalStage;
    const approvalField = `${rejectedStage.toLowerCase()}Approval`;
    
    // Clear the rejection
    if (submission[approvalField]) {
      submission[approvalField] = {
        approved: null,
        approvedAt: null,
        comments: '',
        notifiedAt: null
      };
    }

    // Update status
    submission.status = 'RESUBMITTED';
    submission.submittedAt = new Date();

    // Add to timeline
    submission.approvalTimeline.push({
      stage: rejectedStage,
      action: 'RESUBMITTED',
      actionBy: userId,
      actionAt: new Date(),
      comments: comments || 'Student resubmitted after revision'
    });

    await submission.save();

    // Notify the approver at the current stage
    await notifyNextApprover({
      submission,
      currentStage: null, // Force notification to current stage
      student: submission.studentId,
      event: submission.eventId
    });

    // Special notification to the rejector
    const rejectorField = rejectedStage === 'MENTOR' ? 'mentorId' 
      : rejectedStage === 'CLASS_ADVISOR' ? 'advisorId'
      : rejectedStage === 'INNOVATION_COORDINATOR' ? 'innovationCoordinatorId'
      : rejectedStage === 'HOD' ? 'hodId'
      : 'principalId';

    if (submission[rejectorField]) {
      const Faculty = require('../models/Faculty');
      const rejector = await Faculty.findById(submission[rejectorField]).select('userId');
      
      if (rejector?.userId) {
        await require('../services/enhancedNotification.service').createNotification(
          rejector.userId,
          'RESUBMITTED',
          'Submission Resubmitted',
          `Student has resubmitted the application for "${submission.eventId?.title || 'event'}" after addressing your feedback. Please review.`,
          submission._id,
          'PhaseISubmission'
        );
      }
    }

    res.status(200).json({
      status: 'success',
      data: {
        submission,
        message: 'Submission resubmitted successfully. It will be reviewed again.'
      }
    });

  } catch (error) {
    console.error('Error resubmitting submission:', error);
    next(error);
  }
};

/**
 * Get all submissions that can be resubmitted (rejected by student)
 */
const getResubmittableSubmissions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const Student = require('../models/Student');
    
    const student = await Student.findOne({ userId });
    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Student not found'
      });
    }

    const submissions = await PhaseISubmission.find({
      studentId: student._id,
      status: 'REVISION_REQUESTED'
    })
      .populate('eventId')
      .populate('mentorId')
      .populate('advisorId')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      status: 'success',
      data: {
        count: submissions.length,
        submissions
      }
    });

  } catch (error) {
    console.error('Error getting resubmittable submissions:', error);
    next(error);
  }
};

module.exports = {
  resubmitRejectedSubmission,
  getResubmittableSubmissions
};
