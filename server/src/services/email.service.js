const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create transporter
const createTransporter = () => {
  // Check if SMTP credentials are configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('SMTP credentials not configured. Email sending will be logged only.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send email
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = createTransporter();

    // If no transporter (SMTP not configured), just log
    if (!transporter) {
      logger.info(`[EMAIL NOT SENT - SMTP not configured] To: ${to}, Subject: ${subject}`);
      logger.info(`Content: ${text || html}`);
      return { 
        success: false, 
        message: 'SMTP not configured. Email logged to console.' 
      };
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Student Event System'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
    
    return { 
      success: true, 
      messageId: info.messageId 
    };
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (to, resetToken, userFirstName) => {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
  
  const html = `
    <h2>Password Reset Request</h2>
    <p>Hi ${userFirstName},</p>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request this, please ignore this email.</p>
    <br>
    <p>Best regards,<br>Student Event Management System</p>
  `;

  return sendEmail({
    to,
    subject: 'Password Reset Request',
    html
  });
};

// Send new account credentials
const sendAccountCredentials = async (to, firstName, email, password) => {
  const loginUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
  
  const html = `
    <h2>Welcome to Student Event Management System</h2>
    <p>Hi ${firstName},</p>
    <p>Your account has been created successfully. Here are your login credentials:</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Password:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 3px;">${password}</code></p>
    </div>
    <p style="color: #d32f2f;"><strong>Important:</strong> Please change your password after your first login for security reasons.</p>
    <a href="${loginUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;">Login Now</a>
    <br><br>
    <p>Best regards,<br>Student Event Management System</p>
  `;

  return sendEmail({
    to,
    subject: 'Your Account Credentials',
    html
  });
};

// Send password changed notification
const sendPasswordChangedEmail = async (to, firstName) => {
  const html = `
    <h2>Password Changed Successfully</h2>
    <p>Hi ${firstName},</p>
    <p>Your password has been changed successfully.</p>
    <p>If you didn't make this change, please contact the administrator immediately.</p>
    <br>
    <p>Best regards,<br>Student Event Management System</p>
  `;

  return sendEmail({
    to,
    subject: 'Password Changed',
    html
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendAccountCredentials,
  sendPasswordChangedEmail
};
