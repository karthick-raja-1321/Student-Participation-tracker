# Student Participation Tracker - Login Credentials & Testing Guide

## System Overview
The system has been fully implemented with:
- ✅ Event Creation & Visibility
- ✅ Event View Tracking (Student & Faculty)
- ✅ Student Registration for Events
- ✅ Phase I Submission (Student Details)
- ✅ Multi-Level Approval Workflow (Advisor → Mentor → HOD)
- ✅ Role-Based Submission Visibility

---

## Login Credentials

### SUPER ADMIN
```
Email: admin@sece.ac.in
Password: password123
```

### HOD (Head of Department)
```
CSE Department HOD:
Email: hod.cse@sece.ac.in
Password: password123

ECE Department HOD:
Email: hod.ece@sece.ac.in
Password: password123

EEE Department HOD:
Email: hod.eee@sece.ac.in
Password: password123

MECH Department HOD:
Email: hod.mech@sece.ac.in
Password: password123

CIVIL Department HOD:
Email: hod.civil@sece.ac.in
Password: password123
```

### FACULTY (Advisors & Mentors)
```
Class Advisor (CSE):
Email: faculty1@sece.ac.in
Password: password123
Role: Class Advisor for CSE students
Faculty ID: FAC2000

Innovation Coordinator/Mentor (CSE):
Email: faculty2@sece.ac.in
Password: password123
Role: Mentor for CSE students
Faculty ID: FAC2001

Other Faculty:
Email: faculty3@sece.ac.in to faculty9@sece.ac.in
Password: password123 (for all)
```

### STUDENT
```
Multiple students are registered in the system
Currently testing with: Student from Year 1, Section A
Password: password123 (for all students)
```

---

## Step-by-Step Testing Guide

### 1. **Create an Event** (As Faculty1)
- Login with `faculty1@sece.ac.in`
- Navigate to **Events** → **Create Event**
- Fill in event details:
  - Title: "Test Workshop"
  - Description: "A testing workshop"
  - Event Type: WORKSHOP
  - Venue: Main Hall
  - Start Date: (Select future date)
  - End Date: (Select future date)
- Click **Create**
- ✅ Event created and visible to all faculty in the department

### 2. **View Event** (As Student & Faculty)
- **As Student**: Login with any student account
  - Navigate to **Events**
  - View the created event
  - Click on it to see details
  - ✅ View count increases

- **As Faculty2**: Login with `faculty2@sece.ac.in`
  - Navigate to **Events**
  - View the same event
  - ✅ View count increases again

### 3. **Register for Event** (As Student)
- Login as student
- Go to **Events** → Find the created event
- Click **Register** or **Participate**
- Select participation type: INDIVIDUAL or TEAM
- Fill registration details
- Click **Submit**
- ✅ Registration successful

### 4. **Submit Phase I** (As Student)
- Login as student
- Go to **Submissions** → **Phase I** tab
- Click **New Submission**
- Select the event you registered for
- Fill in event participation details
- Click **Submit**
- ✅ Phase I submission created

### 5. **Class Advisor Approval** (As Faculty1)
- Login with `faculty1@sece.ac.in` (Class Advisor)
- Go to **Approvals** tab
- Click on **Advisor Approvals** tab (first tab)
- You will see submissions from your assigned students
- Click **Approve** on the submission
- Add comments: "Looks good. Approved by advisor."
- Click **Approve** in dialog
- ✅ Advisor approval recorded

### 6. **Mentor Approval** (As Faculty2)
- Login with `faculty2@sece.ac.in` (Mentor/Innovation Coordinator)
- Go to **Approvals** tab
- Click on **Mentor Approvals** tab (second tab)
- **Note**: Will only show submissions where advisor has already approved
- Click **Approve** on the submission
- Add comments: "Excellent submission. Approved by mentor."
- Click **Approve** in dialog
- ✅ Mentor approval recorded

### 7. **HOD Final Approval** (As HOD)
- Login with `hod.cse@sece.ac.in`
- Go to **Approvals** tab
- Click on **HOD Approvals** tab (third tab)
- **Note**: Will only show submissions where both advisor and mentor have approved
- Click **Approve** on the submission
- Add comments: "All approvals verified. Final approval granted."
- Click **Approve** in dialog
- ✅ HOD approval recorded and submission marked as APPROVED

### 8. **View Submission Details** (As Any User)
- After submission is created, go to **Submissions** → **Phase I**
- Click **View** on any submission
- You will see:
  - Event Information
  - Registration Details
  - Complete Approval Progress with all three levels:
    - ✓ Advisor: APPROVED
    - ✓ Mentor: APPROVED
    - ✓ HOD: APPROVED

---

## Key Features Verification

### Approval Workflow Rules
✅ **Advisor must approve first** - Mentor approval blocked until advisor approves
✅ **Mentor approval after advisor** - HOD approval blocked until mentor approves
✅ **HOD final approval** - Can only approve when both advisor and mentor approved
✅ **Comments preserved** - All approval comments stored and displayed

### Role-Based Visibility
✅ **Class Advisor** can see submissions from students they advise
✅ **Mentor/Innovation Coordinator** can see submissions from students they mentor
✅ **HOD** can see all submissions from their department
✅ **Students** can see only their own submissions with approval progress

### View Tracking
✅ **Events visible to all** department members
✅ **View count increases** when faculty or student visits event
✅ **View history preserved** in database

---

## Database Verification

Run this to verify workflow completion:
```bash
cd server
node testCompleteWorkflow.js
```

Expected output will show:
- Event created
- Views tracked
- Registration successful
- Phase I submission created
- All approvals recorded (Advisor → Mentor → HOD)
- Final submission status: APPROVED

---

## Troubleshooting

### Issue: "No pending submissions"
**Solution**: Make sure submissions were created and that you're logged in with the correct role (Advisor for Advisor Approvals tab, etc.)

### Issue: "Cannot see approval status"
**Solution**: The submission must go through all approval levels sequentially. Start with Advisor approval.

### Issue: "Previous approval not showing"
**Solution**: Refresh the page to see the latest approval data from the server.

---

## System Architecture Summary

```
Event Creation (Faculty)
    ↓
Event Visibility (Auto to all department)
    ↓
Student Registration
    ↓
Phase I Submission (Student)
    ↓
Advisor Approval (Class Advisor)
    ↓
Mentor Approval (Innovation Coordinator)
    ↓
HOD Final Approval
    ↓
Submission Status: APPROVED
    ↓
View Timeline in Submissions → View details
```

---

## Frontend URL
```
http://localhost:5173
```

## Backend API URL
```
http://localhost:5000
```

---

Last Updated: December 5, 2025
