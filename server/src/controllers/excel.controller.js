const ExcelJS = require('exceljs');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const User = require('../models/User');
const ExcelImportLog = require('../models/ExcelImportLog');
const logger = require('../config/logger');

// Import students from Excel
exports.importStudents = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Get all departments for validation
    const departments = await Department.find({});
    const deptMap = {};
    departments.forEach(d => {
      deptMap[d.code.toUpperCase()] = d;
    });

    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      rows.push({ row, rowNumber });
    });

    results.total = rows.length;

    for (const { row, rowNumber } of rows) {
      try {
        const rollNumber = row.getCell(1).value?.toString().trim();
        const firstName = row.getCell(2).value?.toString().trim();
        const lastName = row.getCell(3).value?.toString().trim();
        const email = row.getCell(4).value?.toString().trim();
        const phone = row.getCell(5).value?.toString().trim();
        const departmentCode = row.getCell(6).value?.toString().trim().toUpperCase();
        const year = parseInt(row.getCell(7).value);
        const section = row.getCell(8).value?.toString().trim().toUpperCase();
        const cgpa = parseFloat(row.getCell(9).value);

        // Validate required fields
        if (!rollNumber || !firstName || !lastName || !email || !departmentCode || !year || !section) {
          results.errors.push({
            row: rowNumber,
            rollNumber,
            error: 'Missing required fields'
          });
          results.failed++;
          continue;
        }

        // Validate department exists
        const department = deptMap[departmentCode];
        if (!department) {
          results.errors.push({
            row: rowNumber,
            rollNumber,
            error: `Department code '${departmentCode}' not found`
          });
          results.failed++;
          continue;
        }

        // Validate section based on department's numberOfSections
        const sectionIndex = section.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        const maxSections = department.numberOfSections || 3;
        
        if (sectionIndex < 0 || sectionIndex >= maxSections) {
          const validSections = Array.from({ length: maxSections }, (_, i) => 
            String.fromCharCode(65 + i)
          ).join(', ');
          
          results.errors.push({
            row: rowNumber,
            rollNumber,
            error: `Invalid section '${section}' for ${department.name}. Valid sections: ${validSections}`
          });
          results.failed++;
          continue;
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ rollNumber });
        if (existingStudent) {
          results.errors.push({
            row: rowNumber,
            rollNumber,
            error: 'Student with this roll number already exists'
          });
          results.failed++;
          continue;
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.errors.push({
            row: rowNumber,
            rollNumber,
            error: 'Email already exists'
          });
          results.failed++;
          continue;
        }

        // Use default password
        const password = 'Password123';

        // Create user
        const user = await User.create({
          email,
          password,
          firstName,
          lastName,
          phone: phone || undefined,
          role: 'STUDENT',
          departmentId: department._id
        });

        // Create student
        await Student.create({
          userId: user._id,
          rollNumber,
          departmentId: department._id,
          year,
          section,
          cgpa: cgpa || undefined
        });

        results.successful++;
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          rollNumber: row.getCell(1).value?.toString(),
          error: error.message
        });
        results.failed++;
      }
    }

    // Create import log
    await ExcelImportLog.create({
      importType: 'students',
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
      totalRows: results.total,
      successfulRows: results.successful,
      failedRows: results.failed,
      errors: results.errors,
      status: results.failed === 0 ? 'completed' : 'partial'
    });

    logger.info(`Student import completed: ${results.successful}/${results.total} successful`);

    res.json({
      status: 'success',
      message: `Imported ${results.successful} of ${results.total} students`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Import faculty from Excel
exports.importFaculty = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const worksheet = workbook.getWorksheet(1);

    const results = {
      total: 0,
      successful: 0,
      failed: 0,
      errors: []
    };

    // Get all departments
    const departments = await Department.find({});
    const deptMap = {};
    departments.forEach(d => {
      deptMap[d.code.toUpperCase()] = d;
    });

    const rows = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      rows.push({ row, rowNumber });
    });

    results.total = rows.length;

    for (const { row, rowNumber } of rows) {
      try {
        const employeeId = row.getCell(1).value?.toString().trim();
        const firstName = row.getCell(2).value?.toString().trim();
        const lastName = row.getCell(3).value?.toString().trim();
        const email = row.getCell(4).value?.toString().trim();
        const departmentCode = row.getCell(5).value?.toString().trim().toUpperCase();
        const designation = row.getCell(6).value?.toString().trim();
        const phone = row.getCell(7).value?.toString().trim();

        if (!employeeId || !firstName || !lastName || !email || !departmentCode) {
          results.errors.push({
            row: rowNumber,
            employeeId,
            error: 'Missing required fields'
          });
          results.failed++;
          continue;
        }

        const department = deptMap[departmentCode];
        if (!department) {
          results.errors.push({
            row: rowNumber,
            employeeId,
            error: `Department code '${departmentCode}' not found`
          });
          results.failed++;
          continue;
        }

        const existingFaculty = await Faculty.findOne({ employeeId });
        if (existingFaculty) {
          results.errors.push({
            row: rowNumber,
            employeeId,
            error: 'Faculty with this employee ID already exists'
          });
          results.failed++;
          continue;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          results.errors.push({
            row: rowNumber,
            employeeId,
            error: 'Email already exists'
          });
          results.failed++;
          continue;
        }

        const password = 'Password123';

        const user = await User.create({
          email,
          password,
          firstName,
          lastName,
          phone: phone || undefined,
          role: 'FACULTY',
          departmentId: department._id,
          employeeId
        });

        await Faculty.create({
          userId: user._id,
          employeeId,
          departmentId: department._id,
          designation: designation || 'Assistant Professor'
        });

        results.successful++;
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          employeeId: row.getCell(1).value?.toString(),
          error: error.message
        });
        results.failed++;
      }
    }

    await ExcelImportLog.create({
      importType: 'faculty',
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
      totalRows: results.total,
      successfulRows: results.successful,
      failedRows: results.failed,
      errors: results.errors,
      status: results.failed === 0 ? 'completed' : 'partial'
    });

    logger.info(`Faculty import completed: ${results.successful}/${results.total} successful`);

    res.json({
      status: 'success',
      message: `Imported ${results.successful} of ${results.total} faculty members`,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

// Get import logs
exports.getImportLogs = async (req, res, next) => {
  try {
    const { importType, status } = req.query;
    const filter = {};
    
    if (importType) filter.importType = importType;
    if (status) filter.status = status;

    const logs = await ExcelImportLog.find(filter)
      .populate('uploadedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      status: 'success',
      data: { logs }
    });
  } catch (error) {
    next(error);
  }
};
