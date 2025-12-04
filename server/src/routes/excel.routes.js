const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { hasPermission } = require('../middleware/permission');
const { PERMISSIONS } = require('../config/constants');
const upload = require('../middleware/upload');
const ExcelJS = require('exceljs');
const excelController = require('../controllers/excel.controller');

router.get('/templates/:type', protect, async (req, res) => {
  try {
    const { type } = req.params;
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');

    let columns = [];
    let sampleData = [];

    switch (type) {
      case 'students':
        columns = [
          { header: 'Roll Number', key: 'rollNumber', width: 15 },
          { header: 'First Name', key: 'firstName', width: 20 },
          { header: 'Last Name', key: 'lastName', width: 20 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Phone', key: 'phone', width: 15 },
          { header: 'Department Code', key: 'departmentCode', width: 15 },
          { header: 'Year', key: 'year', width: 10 },
          { header: 'Section', key: 'section', width: 10 },
          { header: 'CGPA', key: 'cgpa', width: 10 },
        ];
        sampleData = [
          {
            rollNumber: '2021CS001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '9876543210',
            departmentCode: 'CSE',
            year: 2,
            section: 'A',
            cgpa: 8.5,
          },
        ];
        break;

      case 'faculty':
        columns = [
          { header: 'Employee ID', key: 'employeeId', width: 15 },
          { header: 'First Name', key: 'firstName', width: 20 },
          { header: 'Last Name', key: 'lastName', width: 20 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Department Code', key: 'departmentCode', width: 15 },
          { header: 'Designation', key: 'designation', width: 20 },
          { header: 'Phone', key: 'phone', width: 15 },
        ];
        sampleData = [
          {
            employeeId: 'FAC001',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            departmentCode: 'CSE',
            designation: 'Assistant Professor',
            phone: '9876543210',
          },
        ];
        break;

      case 'departments':
        columns = [
          { header: 'Department Code', key: 'code', width: 15 },
          { header: 'Department Name', key: 'name', width: 30 },
          { header: 'HOD Employee ID', key: 'hodEmployeeId', width: 20 },
        ];
        sampleData = [
          {
            code: 'CSE',
            name: 'Computer Science and Engineering',
            hodEmployeeId: 'FAC001',
          },
        ];
        break;

      default:
        return res.status(400).json({ status: 'error', message: 'Invalid template type' });
    }

    worksheet.columns = columns;

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Add sample data
    sampleData.forEach((data) => worksheet.addRow(data));

    // Set response headers
    const filename = `${type}_template.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/upload/students', protect, hasPermission(PERMISSIONS.EXCEL_IMPORT), upload.single('file'), excelController.importStudents);
router.post('/upload/faculty', protect, hasPermission(PERMISSIONS.EXCEL_IMPORT), upload.single('file'), excelController.importFaculty);

router.get('/logs', protect, excelController.getImportLogs);

module.exports = router;
