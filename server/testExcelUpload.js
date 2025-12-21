const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const testExcelUpload = async () => {
  const apiUrl = 'https://student-participation-tracker.onrender.com/api';
  
  try {
    // Step 1: Login as admin (who has EXCEL_IMPORT permission)
    console.log('Step 1: Login as admin...');
    const loginRes = await axios.post(`${apiUrl}/auth/login`, {
      email: 'admin@sece.ac.in',
      password: 'Password123'
    });
    
    const token = loginRes.data.data.token;
    console.log('✓ Login successful, token received');
    if (!token) throw new Error('No token in response');
    
    // Step 2: Create a simple test Excel file
    console.log('\nStep 2: Creating test Excel file...');
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Faculty');
    
    worksheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'First Name', key: 'firstName', width: 20 },
      { header: 'Last Name', key: 'lastName', width: 20 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Department Code', key: 'departmentCode', width: 15 },
      { header: 'Designation', key: 'designation', width: 20 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Class Advisor (e.g., "2 CSE A" or leave blank)', key: 'classAdvisor', width: 30 },
      { header: 'Is Innovation Coordinator (TRUE/FALSE)', key: 'isInnovationCoordinator', width: 25 }
    ];
    
    worksheet.addRow({
      employeeId: 'TEST001',
      firstName: 'Test',
      lastName: 'Faculty',
      email: 'test.faculty@sece.ac.in',
      departmentCode: 'CSE',
      designation: 'Assistant Professor',
      phone: '9999999999',
      classAdvisor: '',
      isInnovationCoordinator: 'FALSE'
    });
    
    const filePath = './test_faculty.xlsx';
    await workbook.xlsx.writeFile(filePath);
    console.log('✓ Excel file created:', filePath);
    
    // Step 3: Upload the file
    console.log('\nStep 3: Uploading Excel file...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const uploadRes = await axios.post(`${apiUrl}/excel/upload/faculty`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✓ Upload successful!');
    console.log('Response:', JSON.stringify(uploadRes.data, null, 2));
    
  } catch (error) {
    console.error('✗ Error:', error.response?.status, error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Full response:', JSON.stringify(error.response.data, null, 2));
      console.error('\nNote: The error message shows the validation is still using lowercase values.');
      console.error('Make sure Render has deployed the latest code from GitHub.');
      console.error('Check: git log --oneline -1');
    }
  }
};

testExcelUpload();
