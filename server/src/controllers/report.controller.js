const Student = require('../models/Student');
const PhaseISubmission = require('../models/PhaseISubmission');
const PhaseIISubmission = require('../models/PhaseIISubmission');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const ExcelJS = require('exceljs');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

// @desc    Generate consolidated participation report
// @route   GET /api/reports/participation
// @access  Private
exports.getParticipationReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department, year } = req.query;

    const query = {};
    if (department) query.departmentId = department;
    if (year) query.year = parseInt(year);

    const students = await Student.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('departmentId', 'name code');

    const reportData = [];

    for (const student of students) {
      // Get Phase I submissions
      const phaseISubmissions = await PhaseISubmission.find({
        studentId: student._id,
        ...(startDate && endDate && {
          submittedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        }),
      }).populate('registrationId');

      // Get Phase II submissions with prize info
      const phaseIISubmissions = await PhaseIISubmission.find({
        studentId: student._id,
        ...(startDate && endDate && {
          submittedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        }),
      }).populate('eventId', 'title');

      const totalPrizeAmount = phaseIISubmissions.reduce(
        (sum, sub) => sum + (sub.prizeAmount || 0),
        0
      );

      const participationCount = phaseISubmissions.length;
      const prizesWon = phaseIISubmissions.filter((s) => s.prizeWon).length;

      reportData.push({
        rollNumber: student.rollNumber,
        studentName: `${student.userId.firstName} ${student.userId.lastName}`,
        email: student.userId.email,
        department: student.departmentId.code,
        year: student.year,
        section: student.section,
        cgpa: student.cgpa || 0,
        participationCount,
        prizesWon,
        totalPrizeAmount,
        events: phaseISubmissions.map((sub) => ({
          eventName: sub.eventDetails?.eventName || 'N/A',
          submissionDate: sub.submittedAt,
          status: sub.status,
        })),
        prizes: phaseIISubmissions
          .filter((s) => s.prizeWon)
          .map((sub) => ({
            eventName: sub.eventId?.title || 'N/A',
            prize: sub.prizeWon,
            amount: sub.prizeAmount || 0,
          })),
      });
    }

    res.json({
      status: 'success',
      data: { report: reportData },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export participation report as Excel with submission proofs
// @route   GET /api/reports/export
// @access  Private
exports.exportParticipationReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department, year } = req.query;

    const query = {};
    if (department) query.departmentId = department;
    if (year) query.year = parseInt(year);

    const students = await Student.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('departmentId', 'name code');

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Participation Report');

    // Add institution header with logo (if available)
    const logoPath = path.join(__dirname, '../../public/logo.png');
    let currentRow = 1;
    
    if (fs.existsSync(logoPath)) {
      try {
        const imageId = workbook.addImage({
          filename: logoPath,
          extension: 'png',
        });
        
        worksheet.addImage(imageId, {
          tl: { col: 4, row: 0 },
          ext: { width: 100, height: 100 },
        });
        
        currentRow = 7; // Start data after logo
      } catch (error) {
        console.log('Could not add logo to report:', error.message);
      }
    }

    // Add institution name header
    worksheet.mergeCells(`A${currentRow}:K${currentRow}`);
    const headerCell = worksheet.getCell(`A${currentRow}`);
    headerCell.value = 'STUDENT PARTICIPATION REPORT';
    headerCell.font = { size: 16, bold: true };
    headerCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow += 2;

    // Define columns
    worksheet.getRow(currentRow).values = [
      'Roll Number',
      'Student Name',
      'Email',
      'Department',
      'Year',
      'Section',
      'CGPA',
      'Total Participations',
      'Prizes Won',
      'Total Prize Amount',
      'Event Details',
    ];

    // Set column widths
    worksheet.columns = [
      { width: 15 },  // Roll Number
      { width: 25 },  // Student Name
      { width: 30 },  // Email
      { width: 15 },  // Department
      { width: 10 },  // Year
      { width: 10 },  // Section
      { width: 10 },  // CGPA
      { width: 20 },  // Total Participations
      { width: 15 },  // Prizes Won
      { width: 20 },  // Total Prize Amount
      { width: 50 },  // Event Details
    ];

    // Style header row
    worksheet.getRow(currentRow).font = { bold: true };
    worksheet.getRow(currentRow).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(currentRow).font = { color: { argb: 'FFFFFFFF' }, bold: true };
    currentRow++;

    // Add data rows
    for (const student of students) {
      const phaseISubmissions = await PhaseISubmission.find({
        studentId: student._id,
        ...(startDate && endDate && {
          submittedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        }),
      });

      const phaseIISubmissions = await PhaseIISubmission.find({
        studentId: student._id,
        ...(startDate && endDate && {
          submittedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        }),
      }).populate('eventId', 'title');

      const totalPrizeAmount = phaseIISubmissions.reduce(
        (sum, sub) => sum + (sub.prizeAmount || 0),
        0
      );

      const eventDetails = phaseISubmissions
        .map(
          (sub, idx) =>
            `${idx + 1}. ${sub.eventDetails?.eventName || 'N/A'} (${new Date(
              sub.submittedAt
            ).toLocaleDateString()})`
        )
        .join('\n');

      worksheet.addRow({
        rollNumber: student.rollNumber,
        studentName: `${student.userId.firstName} ${student.userId.lastName}`,
        email: student.userId.email,
        department: student.departmentId.code,
        year: student.year,
        section: student.section,
        cgpa: student.cgpa || 0,
        participationCount: phaseISubmissions.length,
        prizesWon: phaseIISubmissions.filter((s) => s.prizeWon).length,
        totalPrizeAmount,
        eventDetails: eventDetails || 'No participation',
      });
    }

    // Auto-fit columns and set alignment
    worksheet.columns.forEach((column) => {
      column.alignment = { vertical: 'middle', wrapText: true };
    });

    // Generate filename
    const filename = `Participation_Report_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// @desc    Export participation report with submission proof documents as ZIP
// @route   GET /api/reports/export-with-proofs
// @access  Private
exports.exportWithProofs = async (req, res, next) => {
  try {
    const { startDate, endDate, department, year } = req.query;

    const query = {};
    if (department) query.departmentId = department;
    if (year) query.year = parseInt(year);

    const students = await Student.find(query)
      .populate('userId', 'firstName lastName email')
      .populate('departmentId', 'name code');

    // Create ZIP archive
    const archive = archiver('zip', { zlib: { level: 9 } });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Participation_Report_${new Date().toISOString().split('T')[0]}.zip"`
    );

    archive.pipe(res);

    // Create Excel report
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Participation Report');

    worksheet.columns = [
      { header: 'Roll Number', key: 'rollNumber', width: 15 },
      { header: 'Student Name', key: 'studentName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Department', key: 'department', width: 15 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Section', key: 'section', width: 10 },
      { header: 'CGPA', key: 'cgpa', width: 10 },
      { header: 'Total Participations', key: 'participationCount', width: 20 },
      { header: 'Prizes Won', key: 'prizesWon', width: 15 },
      { header: 'Total Prize Amount', key: 'totalPrizeAmount', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add data and collect proof documents
    for (const student of students) {
      const phaseISubmissions = await PhaseISubmission.find({
        studentId: student._id,
        ...(startDate && endDate && {
          submittedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        }),
      });

      const phaseIISubmissions = await PhaseIISubmission.find({
        studentId: student._id,
        ...(startDate && endDate && {
          submittedAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        }),
      });

      const totalPrizeAmount = phaseIISubmissions.reduce(
        (sum, sub) => sum + (sub.prizeAmount || 0),
        0
      );

      worksheet.addRow({
        rollNumber: student.rollNumber,
        studentName: `${student.userId.firstName} ${student.userId.lastName}`,
        email: student.userId.email,
        department: student.departmentId.code,
        year: student.year,
        section: student.section,
        cgpa: student.cgpa || 0,
        participationCount: phaseISubmissions.length,
        prizesWon: phaseIISubmissions.filter((s) => s.prizeWon).length,
        totalPrizeAmount,
      });

      // Add submission proof documents to ZIP
      const studentFolder = `${student.rollNumber}_${student.userId.firstName}_${student.userId.lastName}`;

      for (const [idx, submission] of phaseISubmissions.entries()) {
        if (submission.documents?.selectionProof) {
          const proofPath = path.join(
            __dirname,
            '../../',
            submission.documents.selectionProof
          );
          if (fs.existsSync(proofPath)) {
            archive.file(proofPath, {
              name: `${studentFolder}/Event_${idx + 1}_Selection_Proof${path.extname(
                proofPath
              )}`,
            });
          }
        }
        if (submission.documents?.paymentProof) {
          const proofPath = path.join(
            __dirname,
            '../../',
            submission.documents.paymentProof
          );
          if (fs.existsSync(proofPath)) {
            archive.file(proofPath, {
              name: `${studentFolder}/Event_${idx + 1}_Payment_Proof${path.extname(
                proofPath
              )}`,
            });
          }
        }
      }
    }

    // Add Excel file to ZIP
    const excelBuffer = await workbook.xlsx.writeBuffer();
    archive.append(excelBuffer, { name: 'Participation_Report.xlsx' });

    // Finalize archive
    await archive.finalize();
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/reports/dashboard
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalEvents = await Event.countDocuments();
    const totalSubmissions = await PhaseISubmission.countDocuments();
    const totalPrizes = await PhaseIISubmission.countDocuments({ prizeWon: { $ne: null } });

    res.json({
      status: 'success',
      data: {
        totalStudents,
        totalEvents,
        totalSubmissions,
        totalPrizes,
      },
    });
  } catch (error) {
    next(error);
  }
};
