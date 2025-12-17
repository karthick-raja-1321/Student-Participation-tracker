# Role Switching Feature - Quick Start Guide

## Overview
Role switching allows **SUPER_ADMIN** users to simulate other roles (HOD, FACULTY, STUDENT) to test the system and understand how it works from different perspectives. This is a testing/demonstration feature that doesn't affect the user's actual permissions in the database.

---

## How to Access

### Step 1: Login as SUPER_ADMIN
```
Email: admin@sece.ac.in
Password: Password123
```

### Step 2: Open Role Switcher
- Click the **user icon** (👤) in the top-right corner of the app
- You'll see your profile menu showing:
  - Your name
  - Your email
  - Current role: **SUPER_ADMIN**
- Look for **"Switch Role (Admin)"** option
- Click it to open the Role Switch dialog

---

## Using the Role Switch Dialog

### Available Roles to Switch To
- `SUPER_ADMIN` - Full system access (no department required)
- `HOD` - Head of Department (requires department selection)
- `FACULTY` - Faculty member (requires department selection)
- `PRINCIPAL` - Principal (no department required)
- `STUDENT` - Student user (requires department selection)

### Step-by-Step Process

1. **Select a Role** - Choose the role you want to simulate from the dropdown
2. **Select Department** (if required) - For department-specific roles, choose which department's role to simulate
3. **Click "Switch Role"** - The system applies the simulated role

### What Happens After Switching
- Your display shows: `Role: [SIMULATED_ROLE] (TEST MODE)` in red
- All dashboards and menus adapt to show what that role would see
- All approvals and permissions work as if you are that role
- Your original role (SUPER_ADMIN) is preserved and can be restored anytime

---

## Restoring Original Role

### Option 1: From Role Switch Dialog
1. Open the Role Switch dialog again
2. Click **"Reset to SUPER_ADMIN"** button
3. Your role will be restored immediately

### Option 2: Logout and Login
- Simply logout and login again
- Your original role will be active

---

## Feature Details

### Backend Implementation
- **New Database Fields** (already added to User model):
  - `simulatedRole` - The role being simulated (null if not in test mode)
  - `simulatedDepartmentId` - The department for the simulated role (null if not needed)
  - `isTestMode` - Boolean flag indicating if a role is being simulated

- **New API Endpoints**:
  - `POST /api/auth/switch-role` - Switch to a different role
  - `POST /api/auth/reset-role` - Reset to original role
  - `GET /api/auth/available-roles` - Get list of available roles and departments

### Authentication Middleware Update
The auth middleware has been updated to:
1. Check if user has `isTestMode = true` and `simulatedRole` set
2. If yes, use the `simulatedRole` instead of the actual `role`
3. Use the `simulatedDepartmentId` if switching to a department-specific role
4. Keep track of both original and simulated roles for logging

### Frontend Implementation
- **RoleSwitch.jsx Component**: Interactive dialog for role switching
- **MainLayout.jsx Integration**: Menu option visible only for SUPER_ADMIN users
- **Redux Integration**: User state updates when role is switched

---

## Use Cases

### 1. Testing Dashboard Layouts
Switch to HOD role to verify HOD Dashboard displays correctly

### 2. Testing Approval Workflows
Switch to different roles to test approval chains:
- Switch to FACULTY → see pending approvals from faculty perspective
- Switch to HOD → see HOD-level approvals
- Switch to INNOVATION_COORDINATOR → see IC-level approvals

### 3. Testing Permission Controls
Verify that certain features are hidden/shown based on role:
- Student role should not see admin features
- Department roles should only see their department data
- SUPER_ADMIN should see all data

### 4. Testing Role-Specific Notifications
Check notification preferences and displays for different roles

### 5. Demonstrating System to Stakeholders
Show how different users experience the system

---

## Security Notes

⚠️ **Important Security Considerations**:
1. Role switching is **SUPER_ADMIN only** - no other user can access this feature
2. The original role is always preserved and can be restored
3. Switching roles does NOT change database permissions - it's a presentation layer feature
4. All actions taken while in switched role are logged with the original admin identity
5. This feature should be **disabled or restricted in production environments**

### To Disable in Production
Set `isTestMode = false` and clear `simulatedRole` before production deployment, or add an environment check:
```javascript
// In RoleSwitch.jsx
if (process.env.NODE_ENV === 'production') {
  return <div>Feature disabled in production</div>;
}
```

---

## Troubleshooting

### Issue: "Switch Role" option not showing
- ✅ Ensure you're logged in as SUPER_ADMIN (role: 'SUPER_ADMIN')
- ✅ Check that your account has `isTestMode` capability in database

### Issue: Can't switch to department-specific role
- ✅ Make sure you selected a department
- ✅ Verify the department exists and is active in the system

### Issue: Role not changing
- ✅ Try refreshing the page (F5)
- ✅ Check browser console for API errors
- ✅ Verify backend `/auth/switch-role` endpoint is working

### Issue: Can't see switched role changes
- ✅ Some dashboards may cache data - try refreshing the page
- ✅ Some components may require logout/login to fully apply the new role

---

## API Response Examples

### Successful Role Switch
```json
{
  "status": "success",
  "message": "Role switched to HOD",
  "data": {
    "user": {
      "id": "64abc123...",
      "email": "admin@sece.ac.in",
      "originalRole": "SUPER_ADMIN",
      "simulatedRole": "HOD",
      "isTestMode": true,
      "firstName": "Super",
      "lastName": "Admin",
      "simulatedDepartmentId": "64dept123...",
      "departmentId": { "name": "CSE", "code": "CSE" }
    }
  }
}
```

### Role Reset
```json
{
  "status": "success",
  "message": "Role reset to SUPER_ADMIN",
  "data": {
    "user": {
      "id": "64abc123...",
      "email": "admin@sece.ac.in",
      "role": "SUPER_ADMIN",
      "isTestMode": false,
      "firstName": "Super",
      "lastName": "Admin"
    }
  }
}
```

---

## Database Query to Check Test Mode Status

```javascript
// Check if a user is in test mode
db.users.findOne({ email: "admin@sece.ac.in" }, {
  role: 1,
  simulatedRole: 1,
  isTestMode: 1,
  simulatedDepartmentId: 1
});

// Reset a user from test mode manually
db.users.updateOne(
  { email: "admin@sece.ac.in" },
  { $set: { simulatedRole: null, simulatedDepartmentId: null, isTestMode: false } }
);
```

---

## Files Modified/Created

### Backend
- ✅ `server/src/controllers/auth.controller.js` - Added 3 new methods
- ✅ `server/src/routes/auth.routes.js` - Added 3 new routes
- ✅ `server/src/middleware/auth.js` - Updated to apply simulated role
- ℹ️ `server/src/models/User.js` - Already has simulatedRole fields

### Frontend
- ✅ `client/src/components/RoleSwitch.jsx` - New component
- ✅ `client/src/components/layout/MainLayout.jsx` - Integrated RoleSwitch

---

## Next Steps / Future Enhancements

1. **Add Activity Logging** - Log all actions taken while in test mode with original admin ID
2. **Add Time Limit** - Auto-reset role after X minutes of test mode
3. **Add Test Mode Badge** - Persistent visual indicator showing you're in test mode
4. **Add Role History** - Show which roles were switched and when
5. **Add Role Template Selection** - Pre-defined role scenarios (e.g., "View as HOD from CSE Dept")
6. **Add Audit Trail** - Track what actions were taken while in switched role

---

## Questions or Issues?

If role switching isn't working:
1. Check browser console (F12) for errors
2. Check server logs for API errors
3. Verify user is SUPER_ADMIN
4. Try clearing browser cache and logging in again
5. Verify database fields exist on User model
