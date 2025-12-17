const Notification = require('../models/Notification');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const { NOTIFICATION_TYPES, APPROVAL_SEQUENCE } = require('../config/constants');

/**
 * Create a single notification
 */
const createNotification = async (userId, type, title, message, relatedId, relatedModel) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedModel
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Create notifications for multiple users
 */
const createBulkNotifications = async (userIds, type, title, message, relatedId, relatedModel) => {
  try {
    const notifications = userIds.map(userId => ({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedModel
    }));
    
    const result = await Notification.insertMany(notifications);
    return result;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Notify mentor when student selects them
 */
const notifyMentorSelected = async ({ mentorUserId, student, event, registration }) => {
  try {
    if (!mentorUserId) return;

    const studentName = student?.userId
      ? `${student.userId.firstName} ${student.userId.lastName}`
      : 'A student';

    const teamInfo = registration?.teamName 
      ? `Team: ${registration.teamName}${registration.teamMembers?.length ? ` (${registration.teamMembers.length} members)` : ''}`
      : 'Individual participation';

    const message = `${studentName} selected you as mentor for "${event?.title || 'an event'}". ${teamInfo}`;

    await createNotification(
      mentorUserId,
      NOTIFICATION_TYPES.MENTOR_SELECTED,
      'New Mentorship Request',
      message,
      registration?._id || event?._id,
      'PhaseISubmission'
    );
  } catch (error) {
    console.error('Error notifying mentor selection:', error);
  }
};

/**
 * Notify student when mentor accepts/rejects
 */
const notifyMentorDecision = async ({ studentUserId, mentorName, approved, event, comments }) => {
  try {
    if (!studentUserId) return;

    const action = approved ? 'accepted' : 'rejected';
    const type = approved ? NOTIFICATION_TYPES.MENTOR_ACCEPTED : NOTIFICATION_TYPES.MENTOR_REJECTED;
    
    let message = `${mentorName} has ${action} your mentorship request for "${event?.title || 'event'}"`;
    if (comments) {
      message += `. Comments: ${comments}`;
    }
    if (!approved) {
      message += '. Please select a new mentor to continue.';
    }

    await createNotification(
      studentUserId,
      type,
      `Mentorship ${approved ? 'Accepted' : 'Rejected'}`,
      message,
      event?._id,
      'Event'
    );
  } catch (error) {
    console.error('Error notifying mentor decision:', error);
  }
};

/**
 * Notify next approver in the chain
 */
const notifyNextApprover = async ({ submission, currentStage, student, event }) => {
  try {
    const nextStageIndex = APPROVAL_SEQUENCE.indexOf(currentStage) + 1;
    if (nextStageIndex >= APPROVAL_SEQUENCE.length) return; // No more stages

    const nextStage = APPROVAL_SEQUENCE[nextStageIndex];
    let notifyUserId = null;

    const studentName = student?.userId
      ? `${student.userId.firstName} ${student.userId.lastName}`
      : 'A student';

    switch (nextStage) {
      case 'CLASS_ADVISOR':
        if (submission.advisorId) {
          const advisor = await Faculty.findById(submission.advisorId).select('userId');
          notifyUserId = advisor?.userId;
        }
        break;

      case 'INNOVATION_COORDINATOR':
        if (submission.innovationCoordinatorId) {
          const ic = await Faculty.findById(submission.innovationCoordinatorId).select('userId');
          notifyUserId = ic?.userId;
        }
        break;

      case 'HOD':
        if (submission.hodId) {
          const hod = await Faculty.findById(submission.hodId).select('userId');
          notifyUserId = hod?.userId;
        }
        break;

      case 'PRINCIPAL':
        if (submission.principalId) {
          notifyUserId = submission.principalId;
        }
        break;
    }

    if (notifyUserId) {
      const message = `New On-Duty application from ${studentName} for "${event?.title || 'event'}" awaiting your approval`;
      
      await createNotification(
        notifyUserId,
        NOTIFICATION_TYPES.APPROVAL,
        `Approval Required - ${nextStage.replace('_', ' ')}`,
        message,
        submission._id,
        'PhaseISubmission'
      );
    }
  } catch (error) {
    console.error('Error notifying next approver:', error);
  }
};

/**
 * Notify student of approval stage completion
 */
const notifyStageApproval = async ({ studentUserId, stage, approverName, approved, event, comments }) => {
  try {
    if (!studentUserId) return;

    const action = approved ? 'approved' : 'rejected';
    const type = approved ? NOTIFICATION_TYPES.STAGE_APPROVED : NOTIFICATION_TYPES.STAGE_REJECTED;
    
    let message = `${approverName} (${stage.replace('_', ' ')}) has ${action} your On-Duty application for "${event?.title || 'event'}"`;
    if (comments) {
      message += `. Comments: ${comments}`;
    }

    await createNotification(
      studentUserId,
      type,
      `${stage.replace('_', ' ')} ${approved ? 'Approved' : 'Rejected'}`,
      message,
      event?._id,
      'PhaseISubmission'
    );
  } catch (error) {
    console.error('Error notifying stage approval:', error);
  }
};

/**
 * Notify Class Advisor when student submits participation proof (Phase II)
 */
const notifyProofSubmitted = async ({ advisorUserId, student, event }) => {
  try {
    if (!advisorUserId) return;

    const studentName = student?.userId
      ? `${student.userId.firstName} ${student.userId.lastName}`
      : 'A student';

    const message = `${studentName} submitted participation proof for "${event?.title || 'event'}"`;

    await createNotification(
      advisorUserId,
      NOTIFICATION_TYPES.PROOF_SUBMITTED,
      'New Participation Proof Submitted',
      message,
      event?._id,
      'PhaseIISubmission'
    );
  } catch (error) {
    console.error('Error notifying proof submission:', error);
  }
};

/**
 * Notify all stakeholders of Phase II submission
 */
const notifyPhaseIISubmission = async ({ submission, student, event, mentorId, advisorId }) => {
  try {
    const notifyUserIds = [];

    // Notify mentor
    if (mentorId) {
      const mentor = await Faculty.findById(mentorId).select('userId');
      if (mentor?.userId) notifyUserIds.push(mentor.userId);
    }

    // Notify class advisor
    if (advisorId) {
      const advisor = await Faculty.findById(advisorId).select('userId');
      if (advisor?.userId) notifyUserIds.push(advisor.userId);
    }

    // Notify innovation coordinator
    if (submission.innovationCoordinatorId) {
      const ic = await Faculty.findById(submission.innovationCoordinatorId).select('userId');
      if (ic?.userId) notifyUserIds.push(ic.userId);
    }

    // Notify HoD
    if (submission.hodId) {
      const hod = await Faculty.findById(submission.hodId).select('userId');
      if (hod?.userId) notifyUserIds.push(hod.userId);
    }

    const uniqueUserIds = [...new Set(notifyUserIds.map(id => id.toString()))];
    
    const studentName = student?.userId
      ? `${student.userId.firstName} ${student.userId.lastName}`
      : 'A student';

    const message = `${studentName} submitted participation proof for "${event?.title || 'event'}"`;

    await createBulkNotifications(
      uniqueUserIds,
      NOTIFICATION_TYPES.PROOF_SUBMITTED,
      'Participation Proof Submitted',
      message,
      submission._id,
      'PhaseIISubmission'
    );
  } catch (error) {
    console.error('Error notifying Phase II submission:', error);
  }
};

/**
 * Notify when event is auto-archived
 */
const notifyEventArchived = async ({ event }) => {
  try {
    // Notify all registered students
    const EventRegistration = require('../models/EventRegistration');
    const registrations = await EventRegistration.find({ eventId: event._id })
      .populate('studentId', 'userId')
      .lean();

    const userIds = registrations
      .map(r => r.studentId?.userId)
      .filter(Boolean)
      .map(id => id.toString());

    if (userIds.length === 0) return;

    const message = `Event "${event.title}" has been archived. You can still view your submissions and results.`;

    await createBulkNotifications(
      [...new Set(userIds)],
      NOTIFICATION_TYPES.EVENT_ARCHIVED,
      'Event Archived',
      message,
      event._id,
      'Event'
    );
  } catch (error) {
    console.error('Error notifying event archival:', error);
  }
};

/**
 * Notify student when final approval is complete
 */
const notifyFinalApproval = async ({ studentUserId, event, approved }) => {
  try {
    if (!studentUserId) return;

    const message = approved
      ? `Congratulations! Your On-Duty application for "${event?.title || 'event'}" has been fully approved. You can now submit participation proof.`
      : `Your On-Duty application for "${event?.title || 'event'}" has been rejected at final stage.`;

    await createNotification(
      studentUserId,
      approved ? NOTIFICATION_TYPES.APPROVAL : NOTIFICATION_TYPES.REJECTION,
      approved ? 'Application Fully Approved' : 'Application Rejected',
      message,
      event?._id,
      'PhaseISubmission'
    );
  } catch (error) {
    console.error('Error notifying final approval:', error);
  }
};

/**
 * Get approval progress for a submission
 */
const getApprovalProgress = async (submissionId) => {
  try {
    const PhaseISubmission = require('../models/PhaseISubmission');
    const submission = await PhaseISubmission.findById(submissionId);
    
    if (!submission) return null;

    const progress = {
      currentStage: submission.currentApprovalStage,
      timeline: submission.approvalTimeline || [],
      nextStage: null,
      completionPercentage: 0
    };

    const currentIndex = APPROVAL_SEQUENCE.indexOf(submission.currentApprovalStage);
    progress.completionPercentage = ((currentIndex + 1) / APPROVAL_SEQUENCE.length) * 100;
    
    if (currentIndex < APPROVAL_SEQUENCE.length - 1) {
      progress.nextStage = APPROVAL_SEQUENCE[currentIndex + 1];
    }

    return progress;
  } catch (error) {
    console.error('Error getting approval progress:', error);
    return null;
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyMentorSelected,
  notifyMentorDecision,
  notifyNextApprover,
  notifyStageApproval,
  notifyProofSubmitted,
  notifyPhaseIISubmission,
  notifyEventArchived,
  notifyFinalApproval,
  getApprovalProgress
};
