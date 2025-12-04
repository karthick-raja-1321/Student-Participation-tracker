const cron = require('node-cron');
const logger = require('../config/logger');
const PhaseISubmission = require('../models/PhaseISubmission');
const PhaseIISubmission = require('../models/PhaseIISubmission');
const whatsappService = require('./whatsapp.service');

// Check for overdue Phase II submissions and send reminders
const checkOverdueSubmissions = async () => {
  try {
    logger.info('Running overdue submissions check...');

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

    // Find approved Phase I submissions older than 14 days without Phase II submission
    const phaseISubmissions = await PhaseISubmission.find({
      status: 'APPROVED',
      'eventDetails.endDate': { $lte: fourteenDaysAgo }
    }).populate('studentId advisorId mentorId');

    for (const phaseI of phaseISubmissions) {
      // Check if Phase II exists
      const phaseII = await PhaseIISubmission.findOne({ phaseISubmissionId: phaseI._id });

      if (!phaseII || phaseII.isDraft) {
        const daysPending = Math.floor((now - new Date(phaseI.eventDetails.endDate)) / (1000 * 60 * 60 * 24));

        // Create or update Phase II record
        if (!phaseII) {
          await PhaseIISubmission.create({
            phaseISubmissionId: phaseI._id,
            studentId: phaseI.studentId,
            eventId: phaseI.eventId,
            isOverdue: true,
            daysPending,
            phaseIIStatus: 'OVERDUE'
          });
        } else {
          phaseII.isOverdue = true;
          phaseII.daysPending = daysPending;
          phaseII.phaseIIStatus = 'OVERDUE';
          await phaseII.save();
        }

        // Send reminders (every 4 days)
        if (daysPending % 4 === 0) {
          await whatsappService.sendOverdueReminder(phaseI);
        }
      }
    }

    logger.info('Overdue submissions check completed');
  } catch (error) {
    logger.error('Error in overdue submissions check:', error);
  }
};

// Start cron jobs
const startReminders = () => {
  // Run every day at 9:00 AM
  const schedule = process.env.REMINDER_CRON_SCHEDULE || '0 9 * * *';
  
  cron.schedule(schedule, checkOverdueSubmissions);
  
  logger.info(`Reminder cron job scheduled: ${schedule}`);
};

module.exports = {
  startReminders,
  checkOverdueSubmissions
};
