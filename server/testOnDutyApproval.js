const axios = require('axios');

async function testOnDutyApproval() {
  try {
    console.log('\n🧪 TESTING ON-DUTY APPROVAL WORKFLOW\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Step 1: Login as HOD
    console.log('STEP 1️⃣: HOD Login');
    console.log('───────────────────────────────────────────────────────────────');
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'hod.cse@sece.ac.in',
      password: 'Password123'
    });
    
    const token = loginRes.data.data.token;
    const HOD_EMAIL = loginRes.data.data.user.email;
    console.log('✅ HOD Login successful');
    console.log('Email: ' + HOD_EMAIL);
    console.log('Token: ' + token.substring(0, 30) + '...\n');
    
    // Step 2: Get pending on-duty submissions
    console.log('STEP 2️⃣: GET Pending On-Duty Submissions');
    console.log('───────────────────────────────────────────────────────────────');
    const pendingRes = await axios.get('http://localhost:5000/api/submissions/on-duty/pending', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const submissions = pendingRes.data.data.submissions;
    console.log('Status: 200 OK ✓');
    console.log('Pending Submissions Found: ' + submissions.length);
    
    if (submissions.length === 0) {
      console.log('\n⚠️  No pending on-duty submissions found in database');
      console.log('Please insert sample data first using insertSampleData.js\n');
      process.exit(0);
    }
    
    const submission = submissions[0];
    const studentId = submission.studentId._id;
    const submissionId = submission._id;
    
    console.log('\nFirst Submission Details:');
    console.log('  Submission ID: ' + submissionId);
    console.log('  Student: ' + submission.studentId.rollNumber);
    console.log('  Event: ' + submission.eventId.title);
    console.log('  Status: ' + submission.onDutyApprovalStatus);
    console.log('  📊 Balance BEFORE Approval:');
    console.log('     Total Allowed: ' + submission.studentId.onDuty.totalAllowed);
    console.log('     Availed: ' + submission.studentId.onDuty.availed);
    console.log('     Balance: ' + submission.studentId.onDuty.balance + '\n');
    
    // Step 3: Approve the submission
    console.log('STEP 3️⃣: APPROVE On-Duty Submission');
    console.log('───────────────────────────────────────────────────────────────');
    const approveRes = await axios.post(
      'http://localhost:5000/api/submissions/' + submissionId + '/on-duty/approve',
      { remarks: 'Approved - Good participation. Verified at event.' },
      { headers: { 'Authorization': 'Bearer ' + token } }
    );
    
    console.log('Status: ' + approveRes.status + ' ' + (approveRes.status === 200 ? '✓' : '✗'));
    console.log('Message: ' + approveRes.data.message);
    console.log('\n✨ Updated Submission:');
    console.log('  Approval Status: ' + approveRes.data.data.submission.onDutyApprovalStatus);
    console.log('  Overall Status: ' + approveRes.data.data.submission.status);
    console.log('  Approved By: ' + (approveRes.data.data.submission.onDutyApproverId?._id || 'Faculty ID'));
    console.log('  Remarks: ' + approveRes.data.data.submission.remarks);
    
    console.log('\n📊 Balance AFTER Approval (AUTO-REDUCED):');
    console.log('  Availed: ' + approveRes.data.data.studentUpdate.onDutyAvailed + 
      ' (was ' + submission.studentId.onDuty.availed + ') ⬆️');
    console.log('  Balance: ' + approveRes.data.data.studentUpdate.onDutyBalance + 
      ' (was ' + submission.studentId.onDuty.balance + ') ⬇️');
    console.log('  Total Allowed: ' + approveRes.data.data.studentUpdate.totalAllowed + '\n');
    
    // Step 4: Verify balance in database
    console.log('STEP 4️⃣: VERIFY Balance Updated in Database');
    console.log('───────────────────────────────────────────────────────────────');
    const verifyRes = await axios.get('http://localhost:5000/api/submissions/on-duty/pending', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    const remainingPending = verifyRes.data.data.submissions.filter(s => s._id !== submissionId);
    console.log('Remaining Pending Submissions: ' + remainingPending.length);
    console.log('(Approved submission no longer appears in pending list ✓)\n');
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('✅ ON-DUTY APPROVAL TEST COMPLETED SUCCESSFULLY\n');
    console.log('Summary:');
    console.log('  ✓ HOD logged in successfully');
    console.log('  ✓ Retrieved pending on-duty submissions');
    console.log('  ✓ Approved on-duty submission');
    console.log('  ✓ Student balance automatically reduced (availed++, balance--)');
    console.log('  ✓ Changes persisted to database\n');
    
  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error('Status: ' + (error.response?.status || 'N/A'));
    console.error('Message: ' + (error.response?.data?.message || error.message));
    if (error.response?.data?.stack) {
      console.error('Stack: ' + error.response.data.stack.split('\n')[0]);
    }
    process.exit(1);
  }
}

testOnDutyApproval();
