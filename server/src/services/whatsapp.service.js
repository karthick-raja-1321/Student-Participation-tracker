const twilio = require('twilio');
const logger = require('../config/logger');
const WhatsAppLog = require('../models/WhatsAppLog');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

let client;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

// Send WhatsApp message
const sendWhatsAppMessage = async (to, message, submissionId, submissionType) => {
  try {
    if (!client) {
      logger.warn('Twilio client not configured');
      return { success: false, error: 'Twilio not configured' };
    }

    const result = await client.messages.create({
      from: whatsappNumber,
      to: `whatsapp:+91${to}`,
      body: message
    });

    // Log the message
    await WhatsAppLog.create({
      recipientId: submissionId,
      phoneNumber: to,
      message,
      submissionId,
      submissionType,
      messageSid: result.sid,
      status: 'SENT',
      sentAt: new Date()
    });

    logger.info(`WhatsApp message sent to ${to}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    logger.error('Error sending WhatsApp message:', error);
    
    // Log failure
    await WhatsAppLog.create({
      recipientId: submissionId,
      phoneNumber: to,
      message,
      submissionId,
      submissionType,
      status: 'FAILED',
      errorMessage: error.message
    });

    return { success: false, error: error.message };
  }
};

// Send overdue reminder
const sendOverdueReminder = async (phaseISubmission) => {
  try {
    const student = phaseISubmission.studentId;
    const advisor = phaseISubmission.advisorId;
    const mentor = phaseISubmission.mentorId;

    const message = `🚨 Reminder: Phase II submission for "${phaseISubmission.eventDetails.eventName}" is overdue. Please submit as soon as possible.`;

    // Send to student
    if (student.phone) {
      await sendWhatsAppMessage(student.phone, message, phaseISubmission._id, 'PhaseISubmission');
    }

    // Send to advisor
    if (advisor && advisor.phone) {
      await sendWhatsAppMessage(
        advisor.phone,
        `⚠️ Student ${student.firstName} ${student.lastName} has an overdue Phase II submission for "${phaseISubmission.eventDetails.eventName}".`,
        phaseISubmission._id,
        'PhaseISubmission'
      );
    }

    // Send to mentor
    if (mentor && mentor.phone) {
      await sendWhatsAppMessage(
        mentor.phone,
        `⚠️ Your mentee ${student.firstName} ${student.lastName} has an overdue Phase II submission for "${phaseISubmission.eventDetails.eventName}".`,
        phaseISubmission._id,
        'PhaseISubmission'
      );
    }

    logger.info(`Overdue reminders sent for submission ${phaseISubmission._id}`);
  } catch (error) {
    logger.error('Error sending overdue reminders:', error);
  }
};

module.exports = {
  sendWhatsAppMessage,
  sendOverdueReminder
};
