const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const logger = require('./config/logger');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const cronJobs = require('./services/cronJobs');

// Import routes
const authRoutes = require('./routes/auth.routes');
const departmentRoutes = require('./routes/department.routes');
const studentRoutes = require('./routes/student.routes');
const facultyRoutes = require('./routes/faculty.routes');
const eventRoutes = require('./routes/event.routes');
const registrationRoutes = require('./routes/registration.routes');
const phaseIRoutes = require('./routes/phaseI.routes');
const phaseIIRoutes = require('./routes/phaseII.routes');
const approvalRoutes = require('./routes/approval.routes');
const excelRoutes = require('./routes/excel.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const whatsappRoutes = require('./routes/whatsapp.routes');
const fileRoutes = require('./routes/file.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
// Dev-friendly CORS: allow any origin while still permitting credentials; tighten in prod via CLIENT_URL
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/submissions/phase-i', phaseIRoutes);
app.use('/api/submissions/phase-ii', phaseIIRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/excel', excelRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use(errorHandler);

// Start cron jobs
if (process.env.ENABLE_CRON_JOBS === 'true') {
  cronJobs.startReminders();
  logger.info('Cron jobs started');
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...', err);
  process.exit(1);
});
