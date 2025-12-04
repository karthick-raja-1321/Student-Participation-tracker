# Email and Admin Features Update Summary

## Changes Implemented

### 1. Email Service (✅ Completed)
- **File Created**: `server/src/services/email.service.js`
- **Package Installed**: `nodemailer`
- **Features**:
  - Send account credentials to new users
  - Send password reset emails
  - Send password changed notifications
  - Graceful fallback when SMTP not configured (logs to console)

**Email Templates Available**:
- `sendAccountCredentials()` - Sent when admin creates new student/faculty
- `sendPasswordResetEmail()` - Sent for forgot password
- `sendPasswordChangedEmail()` - Sent after password change

### 2. SMTP Configuration
**Updated File**: `server/.env.example`

**Required Environment Variables**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
EMAIL_FROM_NAME=Student Event Management System
CLIENT_URL=http://localhost:5173
```

**Gmail Setup Instructions**:
1. Enable 2-Factor Authentication on your Gmail account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an App Password for "Mail"
4. Use that app password (not your regular password) in `.env`

### 3. Admin Password Reset (✅ Completed)
**New Routes**:
- `POST /api/admin/reset-password/:userId` - Reset any user's password
- `POST /api/admin/generate-password/:userId` - Generate random password

**New Files**:
- `server/src/controllers/admin.controller.js`
- `server/src/routes/admin.routes.js`

**Frontend Updates**:
- Settings page now shows "Admin: Reset User Password" section for SUPER_ADMIN
- Can search user by email and reset their password
- Option to provide custom password or auto-generate
- Password displayed in toast for 10 seconds

### 4. Roll Number Search (✅ Completed)
**Backend**: 
- `student.controller.js` - Added `search` parameter to filter by roll number using regex

**Frontend**:
- Updated Students page with dedicated "Search by Roll Number" field
- Press Enter to search
- Real-time filtering

### 5. Dynamic Sections per Department (✅ Completed)
**Database Model Update**:
- `Department.js` - Added `numberOfSections` field (1-4, default: 3)

**Frontend**:
- Section dropdown now dynamically shows A-D based on selected department's `numberOfSections`
- Validation prevents selecting invalid sections (e.g., Section D for dept with only 3 sections)

**Example**: 
- CSE department has 4 sections (A, B, C, D)
- ECE department has 2 sections (A, B only)
- When creating student, section dropdown adjusts based on selected department

### 6. Email Integration in Controllers (✅ Completed)
**Updated Controllers**:
- `student.controller.js` - Sends credentials email when creating student
- `auth.controller.js` - Sends email on password change and password reset

## Testing the Email Feature

### If SMTP is NOT configured:
- System will log emails to console/logs
- No actual emails sent
- Shows message: "SMTP not configured. Email logged to console."

### If SMTP IS configured:
- Real emails sent via Gmail
- Users receive:
  - Account credentials when created
  - Password reset links
  - Password change confirmations

## How to Use New Features

### 1. Configure Email (Optional but Recommended)
Edit `server/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM_NAME=Sri Eshwar College
CLIENT_URL=http://localhost:5173
```

### 2. Reset User Password as Admin
1. Login as SUPER_ADMIN
2. Go to Settings page
3. Click "Reset User Password" button
4. Enter user's email address
5. Optionally provide new password (or leave blank to auto-generate)
6. Click "Reset Password"
7. New password shown in toast (share with user)
8. Email sent to user with credentials

### 3. Search Students by Roll Number
1. Go to Students page
2. Enter roll number in search field
3. Press Enter or click outside field
4. Results filtered automatically

### 4. Set Department Sections
When creating/editing a department, ensure `numberOfSections` is set (1-4).
The student creation form will automatically show correct section options.

## Database Migration Required

Update existing departments to include `numberOfSections`:

```javascript
// Run in MongoDB shell or create migration script
db.departments.updateMany(
  { numberOfSections: { $exists: false } },
  { $set: { numberOfSections: 3 } }
);
```

Or update manually through the Departments page in the UI.

## Security Notes

1. **App Passwords**: Never use your actual Gmail password. Always use App Passwords.
2. **Environment Variables**: Never commit `.env` file to Git
3. **Admin Routes**: Only SUPER_ADMIN can reset passwords (enforced by `PERMISSIONS.SYSTEM_ADMIN`)
4. **Password Display**: Auto-generated passwords shown in toast for 10 seconds only

## Files Modified

**Backend**:
- `server/src/services/email.service.js` ✨ NEW
- `server/src/controllers/admin.controller.js` ✨ NEW
- `server/src/routes/admin.routes.js` ✨ NEW
- `server/src/controllers/student.controller.js`
- `server/src/controllers/auth.controller.js`
- `server/src/models/Department.js`
- `server/src/index.js`
- `server/.env.example`
- `server/package.json`

**Frontend**:
- `client/src/pages/students/Students.jsx`
- `client/src/pages/Settings.jsx`

## Next Steps

1. **Configure SMTP** in `server/.env` to enable real email sending
2. **Update Departments** to set `numberOfSections` for each department
3. **Test Password Reset** - Try resetting a student's password as SUPER_ADMIN
4. **Test Search** - Search for students by roll number
5. **Test Sections** - Create students in departments with different section counts
