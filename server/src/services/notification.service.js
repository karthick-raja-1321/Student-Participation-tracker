const Notification = require('../models/Notification');
const User = require('../models/User');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const { NOTIFICATION_TYPES } = require('../config/constants');

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
 * Notify a mentor when a student selects them for Phase I / On-Duty
 */
const notifyMentorSelection = async ({ mentorUserId, student, event, registration }) => {
  try {
    if (!mentorUserId) return;

    const studentName = student?.userId
      ? `${student.userId.firstName} ${student.userId.lastName}`
      : 'A student';

    const teamName = registration?.teamName || 'Individual';
    const teamMembers = registration?.teamMembers || [];
    const teamSummary = teamMembers.length > 0
      ? `Team: ${teamName} | Members: ${teamMembers.map(m => m.name || m.rollNumber || '').filter(Boolean).join(', ')}`
      : 'Individual participant';

    const message = `You were selected as mentor by ${studentName} for "${event?.title || 'an event'}". ${teamSummary}`;

    await createNotification(
      mentorUserId,
      NOTIFICATION_TYPES.GENERAL,
      'Mentor Selection',
      message,
      registration?._id || event?._id,
      registration ? 'EventRegistration' : 'Event'
    );
  } catch (error) {
    console.error('Error notifying mentor selection:', error);
  }
};

/**
 * Notify all users when a new event is created
 * @param {Object} event - Event object with createdByFacultyId
 * @param {Object} createdBy - User who created the event
 */
const notifyEventCreation = async (event, createdBy) => {
  try {
    let facultyName = `${createdBy.firstName} ${createdBy.lastName}`;
    
    // If faculty ID exists, get faculty details
    if (event.createdByFacultyId) {
      const faculty = await Faculty.findById(event.createdByFacultyId)
        .populate('userId', 'firstName lastName');
      
      if (faculty?.userId) {
        facultyName = `${faculty.userId.firstName} ${faculty.userId.lastName}`;
      }
    }
    
    const message = `New event "${event.title}" created by ${facultyName}`;
    
    // Get all users in the system (excluding the creator)
    const allUsers = await User.find({ _id: { $ne: createdBy._id } }, '_id');
    const userIds = allUsers.map(u => u._id);
    
    if (userIds.length === 0) return;
    
    await createBulkNotifications(
      userIds,
      NOTIFICATION_TYPES.EVENT_CREATED,
      'New Event Created',
      message,
      event._id,
      'Event'
    );
  } catch (error) {
    console.error('Error notifying event creation:', error);
  }
};

/**
 * Notify approvers when a new submission is created
 * Approvers: Class Advisor of the student, Innovation Coordinators, and HoD of the department
 * @param {Object} submission - Submission object
 * @param {Object} event - Associated event
 * @param {Object} student - Student who submitted
 * @param {String} departmentId - Department ID
 */
const notifySubmissionCreated = async (submission, event, student, departmentId) => {
  try {
    const approvers = [];
    
    // Get the class advisor of the student
    if (student.advisorId) {
      const advisor = await Faculty.findById(student.advisorId).select('userId');
      if (advisor) {
        approvers.push(advisor.userId);
      }
    }
    
    // Get all innovation coordinators in the department
    const innovationCoordinators = await Faculty.find({
      isInnovationCoordinator: true,
      departmentId
    }).select('userId');
    approvers.push(...innovationCoordinators.map(ic => ic.userId));
    
    // Get the HOD of the department
    const hod = await Faculty.findOne({
      role: 'HOD',
      departmentId
    }).select('userId');
    if (hod) {
      approvers.push(hod.userId);
    }
    
    // Remove duplicates
    const uniqueApprovers = [...new Set(approvers.map(a => a.toString()))].map(id => id);
    
    if (uniqueApprovers.length === 0) return;
    
    const studentName = student?.userId 
      ? `${student.userId.firstName} ${student.userId.lastName}`
      : 'A student';
    
    const message = `New submission from ${studentName} for event "${event.title}"`;
    
    await createBulkNotifications(
      uniqueApprovers,
      NOTIFICATION_TYPES.SUBMISSION_CREATED,
      'New Submission',
      message,
      submission._id,
      submission.constructor.modelName || 'PhaseISubmission'
    );
  } catch (error) {
    console.error('Error notifying submission creation:', error);
  }
};

/**
 * Notify student about approval status change
 * @param {Object} submission - Submission object
 * @param {String} status - New status (APPROVED, REJECTED, etc.)
 * @param {Object} student - Student object
 * @param {Object} event - Event object
 */
const notifyApprovalStatus = async (submission, status, student, event) => {
  try {
    if (!student?.userId) return;
    
    const statusText = status === 'APPROVED' ? 'approved' : 'rejected';
    const message = `Your submission for "${event.title}" has been ${statusText}`;
    
    const notificationType = status === 'APPROVED' 
      ? NOTIFICATION_TYPES.SUBMISSION_APPROVED 
      : NOTIFICATION_TYPES.SUBMISSION_REJECTED;
    
    await createNotification(
      student.userId._id,
      notificationType,
      `Submission ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      message,
      submission._id,
      submission.constructor.modelName || 'PhaseISubmission'
    );
  } catch (error) {
    console.error('Error notifying approval status:', error);
  }
};

/**
 * Get approval progress for a submission (for student view)
 * Returns the current state of approval with all phases
 * @param {Object} submission - Submission object with approval details
 * @returns {Object} Approval progress object
 */
const getApprovalProgress = async (submission) => {
  try {
    // This would be populated from the submission object
    // showing which phase the submission is in and who has approved
    return {
      submissionId: submission._id,
      currentStatus: submission.status,
      submittedAt: submission.submittedAt,
      approvalPhases: [
        {
          level: 1,
          name: 'Class Advisor',
          status: submission.status || 'PENDING',
          approvedBy: submission.approvedBy || null,
          approvedAt: submission.approvedAt || null,
          remarks: submission.remarks || null
        }
      ]
    };
  } catch (error) {
    console.error('Error getting approval progress:', error);
  }
};

/**
 * Get submissions for approvers
 * HOD, Innovation Coordinators, Class Advisors can view:
 * - New submissions (status: PENDING)
 * - Approved submissions
 * - Rejected submissions
 * @param {Object} faculty - Faculty object
 * @param {String} departmentId - Department ID
 * @returns {Object} Submissions grouped by status
 */
const getApprovableSubmissions = async (faculty, departmentId) => {
  try {
    const PhaseISubmission = require('../models/PhaseISubmission');
    const PhaseIISubmission = require('../models/PhaseIISubmission');
    
    // Get all submissions for the department
    const filter = { departmentId };
    
    const [phaseISubmissions, phaseIISubmissions] = await Promise.all([
      PhaseISubmission.find(filter)
        .populate('eventId', 'title')
        .populate('studentId', 'userId registerNumber')
        .sort({ submittedAt: -1 }),
      PhaseIISubmission.find(filter)
        .populate('eventId', 'title')
        .populate('studentId', 'userId registerNumber')
        .sort({ submittedAt: -1 })
    ]);
    
    return {
      phaseI: {
        new: phaseISubmissions.filter(s => s.status === 'PENDING'),
        approved: phaseISubmissions.filter(s => s.status === 'APPROVED'),
        rejected: phaseISubmissions.filter(s => s.status === 'REJECTED')
      },
      phaseII: {
        new: phaseIISubmissions.filter(s => s.status === 'PENDING'),
        approved: phaseIISubmissions.filter(s => s.status === 'APPROVED'),
        rejected: phaseIISubmissions.filter(s => s.status === 'REJECTED')
      }
    };
  } catch (error) {
    console.error('Error getting approvable submissions:', error);
  }
};

/**
 * Get submission history for approvers
 * @param {String} departmentId - Department ID
 * @param {String} status - Filter by status (APPROVED, REJECTED, etc.)
 * @returns {Array} Submission history
 */
const getSubmissionHistory = async (departmentId, status = null) => {
  try {
    const PhaseISubmission = require('../models/PhaseISubmission');
    const PhaseIISubmission = require('../models/PhaseIISubmission');
    
    const filter = { departmentId };
    if (status) filter.status = status;
    
    const [phaseI, phaseII] = await Promise.all([
      PhaseISubmission.find(filter)
        .populate('eventId', 'title')
        .populate('studentId', 'userId registerNumber')
        .sort({ approvedAt: -1, submittedAt: -1 }),
      PhaseIISubmission.find(filter)
        .populate('eventId', 'title')
        .populate('studentId', 'userId registerNumber')
        .sort({ approvedAt: -1, submittedAt: -1 })
    ]);
    
    return {
      phaseI,
      phaseII,
      total: phaseI.length + phaseII.length
    };
  } catch (error) {
    console.error('Error getting submission history:', error);
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyEventCreation,
  notifySubmissionCreated,
  notifyApprovalStatus,
  notifyMentorSelection,
  getApprovalProgress,
  getApprovableSubmissions,
  getSubmissionHistory
};
