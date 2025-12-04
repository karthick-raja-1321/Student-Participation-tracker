# Role & Permission Matrix
## Institution-Wide Student Participation Tracking System

---

## 1. User Roles Overview

### 1.1 Role Hierarchy

```
┌─────────────────────────────────────┐
│      SUPER ADMIN                    │
│  (Innovation Coordinator)           │
│  • Institution-wide access          │
│  • All permissions                  │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│             HOD                     │
│  • Department-level access          │
│  • Manage own department only       │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│           FACULTY                   │
│  • Student-level access             │
│  • Manage assigned students         │
│  • Multiple roles possible:         │
│    - Class Advisor                  │
│    - Mentor                         │
│    - Tutor                          │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│           STUDENT                   │
│  • Self access only                 │
│  • View & submit participation      │
└─────────────────────────────────────┘
```

---

## 2. Detailed Permission Matrix

### 2.1 Super Admin (Innovation Coordinator) Permissions

| Module | Feature | Permissions |
|--------|---------|-------------|
| **Dashboard** | Overview | ✅ View institution-wide statistics |
| | Analytics | ✅ Access all department analytics |
| | Reports | ✅ Generate institution-level reports |
| **Department Management** | Create | ✅ Add new departments |
| | Read | ✅ View all departments |
| | Update | ✅ Edit department details |
| | Delete | ✅ Remove departments |
| | Assign HoD | ✅ Assign/change HoD |
| **User Management** | Create Users | ✅ Create HoD, Faculty, Students |
| | Read Users | ✅ View all users across departments |
| | Update Users | ✅ Edit any user profile |
| | Delete Users | ✅ Remove users |
| | Reset Password | ✅ Reset any user password |
| | Activate/Deactivate | ✅ Enable/disable user accounts |
| **Faculty Management** | Assign Roles | ✅ Assign Advisor/Mentor/Tutor roles |
| | View Faculty | ✅ View all faculty members |
| | Manage Workload | ✅ View and manage faculty assignments |
| **Student Management** | Bulk Upload | ✅ Import students via Excel |
| | View Students | ✅ View all students institution-wide |
| | Edit Students | ✅ Update student information |
| | Assign Mentors | ✅ Assign mentors to students |
| | Transfer Students | ✅ Move students between departments |
| **Event Management** | Create Event | ✅ Create institution/department events |
| | Read Events | ✅ View all events |
| | Update Events | ✅ Edit any event |
| | Delete Events | ✅ Remove events |
| | Event Analytics | ✅ View detailed event analytics |
| **Submission Management** | View Submissions | ✅ View all Phase I & II submissions |
| | Track Progress | ✅ Monitor all submission statuses |
| | Download Reports | ✅ Export submission data |
| **Approval Management** | Approve Phase I | ✅ Approve Phase I submissions |
| | Approve Phase II | ✅ Approve Phase II submissions |
| | Reject Submissions | ✅ Reject with comments |
| | Request Revision | ✅ Ask for revisions |
| | Bulk Approval | ✅ Approve multiple submissions |
| **Excel Management** | Download Templates | ✅ Download all Excel templates |
| | Upload Data | ✅ Bulk upload all data types |
| | View Import Logs | ✅ Track all import activities |
| | Download Error Reports | ✅ Download validation errors |
| **Reports & Analytics** | Department-wise | ✅ Generate department reports |
| | Year-wise | ✅ View year-wise participation |
| | Section-wise | ✅ View section-wise reports |
| | Faculty-wise | ✅ View faculty contribution |
| | Event-wise | ✅ Event performance reports |
| | Custom Reports | ✅ Create custom filtered reports |
| | Export to Excel/PDF | ✅ Export all reports |
| **Notifications** | Send Notifications | ✅ Send to all users/departments |
| | View Notifications | ✅ View all notification logs |
| | Configure Alerts | ✅ Set up automated alerts |
| **WhatsApp Integration** | View Logs | ✅ View all WhatsApp message logs |
| | Manual Send | ✅ Send manual reminders |
| | Configure Automation | ✅ Set up reminder schedules |
| **System Settings** | Configure System | ✅ Modify system configurations |
| | Manage Permissions | ✅ Update role permissions |
| | View Audit Logs | ✅ Access system audit trails |

---

### 2.2 HoD (Head of Department) Permissions

| Module | Feature | Permissions | Scope |
|--------|---------|-------------|-------|
| **Dashboard** | Overview | ✅ View department statistics | Own department only |
| | Analytics | ✅ Access department analytics | Own department only |
| | Reports | ✅ Generate department reports | Own department only |
| **Department Management** | Create | ❌ Cannot create departments | - |
| | Read | ✅ View own department | Own department only |
| | Update | ✅ Edit own department details | Own department only |
| | Delete | ❌ Cannot delete department | - |
| **User Management** | Create Users | ✅ Create Faculty, Students | Own department only |
| | Read Users | ✅ View users in department | Own department only |
| | Update Users | ✅ Edit department users | Own department only |
| | Delete Users | ⚠️ Can deactivate (not delete) | Own department only |
| | Reset Password | ✅ Reset faculty/student passwords | Own department only |
| **Faculty Management** | Assign Roles | ✅ Assign Advisor/Mentor/Tutor | Own department only |
| | View Faculty | ✅ View department faculty | Own department only |
| | Manage Workload | ✅ Balance faculty assignments | Own department only |
| | Add Faculty | ✅ Add new faculty members | Own department only |
| **Student Management** | Bulk Upload | ✅ Import students via Excel | Own department only |
| | View Students | ✅ View department students | Own department only |
| | Edit Students | ✅ Update student information | Own department only |
| | Assign Mentors | ✅ Assign mentors/advisors | Own department only |
| | Transfer Students | ❌ Cannot transfer (contact admin) | - |
| **Event Management** | Create Event | ✅ Create department events | Own department only |
| | | ⚠️ Request for institution events | Requires admin approval |
| | Read Events | ✅ View all events | All events |
| | Update Events | ✅ Edit own department events | Own events only |
| | Delete Events | ✅ Delete own department events | Own events only |
| **Submission Management** | View Submissions | ✅ View department submissions | Own department only |
| | Track Progress | ✅ Monitor submission statuses | Own department only |
| | Download Reports | ✅ Export department data | Own department only |
| **Approval Management** | Approve Phase I | ⚠️ Only if configured | Own department only |
| | Approve Phase II | ✅ Approve Phase II submissions | Own department only |
| | Reject Submissions | ✅ Reject with comments | Own department only |
| | Request Revision | ✅ Ask for revisions | Own department only |
| **Excel Management** | Download Templates | ✅ Download all Excel templates | All templates |
| | Upload Data | ✅ Bulk upload department data | Own department only |
| | View Import Logs | ✅ Track own import activities | Own imports only |
| | Download Error Reports | ✅ Download validation errors | Own imports only |
| **Reports & Analytics** | Department-wise | ✅ View own department | Own department only |
| | Year-wise | ✅ View all years in department | Own department only |
| | Section-wise | ✅ View all sections | Own department only |
| | Faculty-wise | ✅ View faculty contribution | Own department only |
| | Event-wise | ✅ Department event reports | Own department only |
| | Custom Reports | ✅ Create filtered reports | Own department only |
| | Export to Excel/PDF | ✅ Export department reports | Own department only |
| **Notifications** | Send Notifications | ✅ Send to department users | Own department only |
| | View Notifications | ✅ View own notifications | Own notifications |
| **WhatsApp Integration** | View Logs | ✅ View department message logs | Own department only |
| | Manual Send | ✅ Send reminders to department | Own department only |

---

### 2.3 Faculty Permissions

**Note:** Faculty can have multiple roles simultaneously:
- **Class Advisor** (1 per section)
- **Mentor** (guides multiple students)
- **Tutor** (2 per section)

| Module | Feature | Permissions | Scope |
|--------|---------|-------------|-------|
| **Dashboard** | Overview | ✅ View assigned students stats | Assigned students only |
| | Analytics | ✅ View student participation | Assigned students only |
| **Student Management** | View Students | ✅ View assigned students | Assigned students only |
| | Edit Students | ⚠️ Limited editing (contact info) | Assigned students only |
| | Monitor Progress | ✅ Track submission status | Assigned students only |
| **Event Management** | Create Event | ✅ Create events (any scope) | All events |
| | Read Events | ✅ View all events | All events |
| | Update Events | ✅ Edit own created events | Own events only |
| | Delete Events | ✅ Delete own created events | Own events only |
| | Register Students | ✅ Register assigned students | Assigned students only |
| **Submission Management** | View Submissions | ✅ View assigned students' submissions | Assigned students only |
| | Track Progress | ✅ Monitor submission timeline | Assigned students only |
| | Download Proofs | ✅ Download submitted documents | Assigned students only |
| **Approval Management** | Approve Phase I | ⚠️ Only as Advisor/Mentor (if configured) | Assigned students only |
| | Approve Phase II | ❌ Cannot approve Phase II | - |
| | View Approval Queue | ✅ View pending approvals | Assigned students only |
| | Request Revision | ✅ Request changes | Assigned students only |
| **Reports & Analytics** | Student-wise | ✅ View individual student reports | Assigned students only |
| | Section-wise | ✅ View section reports (if Advisor) | Assigned section only |
| | Export Reports | ✅ Export assigned student data | Assigned students only |
| **Notifications** | View Notifications | ✅ View own notifications | Own notifications |
| | Receive Reminders | ✅ Get WhatsApp reminders | Auto for overdue students |
| **Profile** | Update Profile | ✅ Edit own profile | Own profile only |
| | Change Password | ✅ Change own password | Own account only |

#### Faculty Role-Specific Permissions

**Class Advisor Additional Permissions:**
- ✅ View entire section student list
- ✅ Generate section-wise reports
- ✅ Approve OD requests (Phase I)
- ✅ Receive section-wide notifications

**Mentor Additional Permissions:**
- ✅ View all mentees
- ✅ Track mentee participation
- ✅ Provide guidance and feedback
- ✅ Approve submissions (if configured)

**Tutor Additional Permissions:**
- ✅ View assigned section students
- ✅ Monitor student progress
- ✅ Assist in event coordination

---

### 2.4 Student Permissions

| Module | Feature | Permissions | Scope |
|--------|---------|-------------|-------|
| **Dashboard** | Overview | ✅ View own participation stats | Own data only |
| | Submission Status | ✅ Track own submission status | Own submissions only |
| **Event Management** | View Events | ✅ View all published events | All published events |
| | Search Events | ✅ Search and filter events | All events |
| | Event Details | ✅ View complete event details | All events |
| | Register | ✅ Register for events | If eligible |
| **Submission Management** | Create Phase I | ✅ Submit Phase I before event | Own submissions |
| | Upload Documents | ✅ Upload OD, proofs, payments | Own submissions |
| | Create Phase II | ✅ Submit Phase II after event | Own submissions |
| | Upload Certificates | ✅ Upload certificates, reports | Own submissions |
| | View Submissions | ✅ View own submission history | Own submissions only |
| | Edit Submissions | ⚠️ Only if not submitted/rejected | Own submissions only |
| | Download Submissions | ✅ Download own submission PDFs | Own submissions only |
| **Approval Tracking** | View Status | ✅ Track approval status | Own submissions only |
| | View Comments | ✅ Read reviewer comments | Own submissions only |
| **Reports** | View Own Reports | ✅ View participation report | Own data only |
| | Download Certificate | ✅ Download participation certificates | If completed |
| **Notifications** | View Notifications | ✅ View own notifications | Own notifications |
| | Event Reminders | ✅ Receive event reminders | Registered events |
| **Profile** | Update Profile | ✅ Edit own profile | Own profile only |
| | Change Password | ✅ Change own password | Own account only |
| | Upload Photo | ✅ Update profile picture | Own profile only |

---

## 3. Permission Code Constants

### 3.1 Backend Permission Definitions

```javascript
// constants/permissions.js

const PERMISSIONS = {
  // Department Permissions
  DEPARTMENT_CREATE: 'department:create',
  DEPARTMENT_READ_ALL: 'department:read:all',
  DEPARTMENT_READ_OWN: 'department:read:own',
  DEPARTMENT_UPDATE_ALL: 'department:update:all',
  DEPARTMENT_UPDATE_OWN: 'department:update:own',
  DEPARTMENT_DELETE: 'department:delete',
  
  // User Permissions
  USER_CREATE_ALL: 'user:create:all',
  USER_CREATE_DEPT: 'user:create:own_dept',
  USER_READ_ALL: 'user:read:all',
  USER_READ_DEPT: 'user:read:own_dept',
  USER_READ_ASSIGNED: 'user:read:assigned',
  USER_UPDATE_ALL: 'user:update:all',
  USER_UPDATE_DEPT: 'user:update:own_dept',
  USER_UPDATE_OWN: 'user:update:own',
  USER_DELETE: 'user:delete',
  USER_DEACTIVATE: 'user:deactivate',
  
  // Event Permissions
  EVENT_CREATE_ALL: 'event:create:all',
  EVENT_CREATE_DEPT: 'event:create:own_dept',
  EVENT_CREATE: 'event:create',
  EVENT_READ_ALL: 'event:read:all',
  EVENT_UPDATE_ALL: 'event:update:all',
  EVENT_UPDATE_OWN: 'event:update:own',
  EVENT_DELETE_ALL: 'event:delete:all',
  EVENT_DELETE_OWN: 'event:delete:own',
  
  // Submission Permissions
  SUBMISSION_CREATE: 'submission:create',
  SUBMISSION_READ_ALL: 'submission:read:all',
  SUBMISSION_READ_DEPT: 'submission:read:own_dept',
  SUBMISSION_READ_ASSIGNED: 'submission:read:assigned',
  SUBMISSION_READ_OWN: 'submission:read:own',
  SUBMISSION_UPDATE_OWN: 'submission:update:own',
  
  // Approval Permissions
  APPROVAL_PHASE_I: 'approval:phase_i',
  APPROVAL_PHASE_II: 'approval:phase_ii',
  APPROVAL_REQUEST_REVISION: 'approval:request_revision',
  APPROVAL_VIEW_ALL: 'approval:view:all',
  APPROVAL_VIEW_DEPT: 'approval:view:own_dept',
  APPROVAL_VIEW_ASSIGNED: 'approval:view:assigned',
  
  // Report Permissions
  REPORT_INSTITUTION: 'report:institution',
  REPORT_DEPARTMENT: 'report:department',
  REPORT_ASSIGNED: 'report:assigned',
  REPORT_OWN: 'report:own',
  REPORT_EXPORT: 'report:export',
  
  // Excel Permissions
  EXCEL_UPLOAD_ALL: 'excel:upload:all',
  EXCEL_UPLOAD_DEPT: 'excel:upload:own_dept',
  EXCEL_DOWNLOAD_TEMPLATE: 'excel:download_template',
  EXCEL_VIEW_LOGS_ALL: 'excel:view_logs:all',
  EXCEL_VIEW_LOGS_OWN: 'excel:view_logs:own',
  
  // Notification Permissions
  NOTIFICATION_SEND_ALL: 'notification:send:all',
  NOTIFICATION_SEND_DEPT: 'notification:send:own_dept',
  NOTIFICATION_VIEW_OWN: 'notification:view:own',
  
  // WhatsApp Permissions
  WHATSAPP_VIEW_ALL: 'whatsapp:view:all',
  WHATSAPP_VIEW_DEPT: 'whatsapp:view:own_dept',
  WHATSAPP_SEND_MANUAL: 'whatsapp:send:manual',
  WHATSAPP_CONFIGURE: 'whatsapp:configure',
  
  // System Permissions
  SYSTEM_CONFIGURE: 'system:configure',
  SYSTEM_AUDIT_LOGS: 'system:audit_logs',
  SYSTEM_MANAGE_ROLES: 'system:manage_roles'
};

module.exports = PERMISSIONS;
```

### 3.2 Role-Permission Mapping

```javascript
// constants/rolePermissions.js

const { PERMISSIONS } = require('./permissions');

const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    // All permissions
    ...Object.values(PERMISSIONS)
  ],
  
  HOD: [
    // Department
    PERMISSIONS.DEPARTMENT_READ_OWN,
    PERMISSIONS.DEPARTMENT_UPDATE_OWN,
    
    // Users
    PERMISSIONS.USER_CREATE_DEPT,
    PERMISSIONS.USER_READ_DEPT,
    PERMISSIONS.USER_UPDATE_DEPT,
    PERMISSIONS.USER_DEACTIVATE,
    
    // Events
    PERMISSIONS.EVENT_CREATE_DEPT,
    PERMISSIONS.EVENT_READ_ALL,
    PERMISSIONS.EVENT_UPDATE_OWN,
    PERMISSIONS.EVENT_DELETE_OWN,
    
    // Submissions
    PERMISSIONS.SUBMISSION_READ_DEPT,
    
    // Approvals
    PERMISSIONS.APPROVAL_PHASE_II,
    PERMISSIONS.APPROVAL_REQUEST_REVISION,
    PERMISSIONS.APPROVAL_VIEW_DEPT,
    
    // Reports
    PERMISSIONS.REPORT_DEPARTMENT,
    PERMISSIONS.REPORT_EXPORT,
    
    // Excel
    PERMISSIONS.EXCEL_UPLOAD_DEPT,
    PERMISSIONS.EXCEL_DOWNLOAD_TEMPLATE,
    PERMISSIONS.EXCEL_VIEW_LOGS_OWN,
    
    // Notifications
    PERMISSIONS.NOTIFICATION_SEND_DEPT,
    PERMISSIONS.NOTIFICATION_VIEW_OWN,
    
    // WhatsApp
    PERMISSIONS.WHATSAPP_VIEW_DEPT,
    PERMISSIONS.WHATSAPP_SEND_MANUAL
  ],
  
  FACULTY: [
    // Users
    PERMISSIONS.USER_READ_ASSIGNED,
    PERMISSIONS.USER_UPDATE_OWN,
    
    // Events
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_READ_ALL,
    PERMISSIONS.EVENT_UPDATE_OWN,
    PERMISSIONS.EVENT_DELETE_OWN,
    
    // Submissions
    PERMISSIONS.SUBMISSION_READ_ASSIGNED,
    
    // Approvals (conditional based on role)
    PERMISSIONS.APPROVAL_VIEW_ASSIGNED,
    PERMISSIONS.APPROVAL_REQUEST_REVISION,
    
    // Reports
    PERMISSIONS.REPORT_ASSIGNED,
    PERMISSIONS.REPORT_EXPORT,
    
    // Notifications
    PERMISSIONS.NOTIFICATION_VIEW_OWN
  ],
  
  STUDENT: [
    // Events
    PERMISSIONS.EVENT_READ_ALL,
    
    // Submissions
    PERMISSIONS.SUBMISSION_CREATE,
    PERMISSIONS.SUBMISSION_READ_OWN,
    PERMISSIONS.SUBMISSION_UPDATE_OWN,
    
    // Reports
    PERMISSIONS.REPORT_OWN,
    
    // Notifications
    PERMISSIONS.NOTIFICATION_VIEW_OWN
  ]
};

module.exports = ROLE_PERMISSIONS;
```

---

## 4. Authorization Middleware

### 4.1 Permission Check Middleware

```javascript
// middleware/authorizationMiddleware.js

const ROLE_PERMISSIONS = require('../constants/rolePermissions');

/**
 * Check if user has required permission
 */
const hasPermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const user = req.user; // From JWT authentication
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized: User not authenticated'
        });
      }
      
      const userPermissions = ROLE_PERMISSIONS[user.role] || [];
      
      if (userPermissions.includes(requiredPermission)) {
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
        error: error.message
      });
    }
  };
};

/**
 * Check if user has any of the required permissions
 */
const hasAnyPermission = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      const userPermissions = ROLE_PERMISSIONS[user.role] || [];
      
      const hasPermission = requiredPermissions.some(permission =>
        userPermissions.includes(permission)
      );
      
      if (hasPermission) {
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
        error: error.message
      });
    }
  };
};

/**
 * Check if user has all required permissions
 */
const hasAllPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized'
        });
      }
      
      const userPermissions = ROLE_PERMISSIONS[user.role] || [];
      
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );
      
      if (hasAllPermissions) {
        return next();
      }
      
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Insufficient permissions'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization error',
        error: error.message
      });
    }
  };
};

/**
 * Check if user can access specific department
 */
const canAccessDepartment = (req, res, next) => {
  try {
    const user = req.user;
    const { departmentId } = req.params;
    
    // Super admin can access all departments
    if (user.role === 'SUPER_ADMIN') {
      return next();
    }
    
    // HOD and Faculty can only access their own department
    if (user.role === 'HOD' || user.role === 'FACULTY') {
      if (user.departmentId.toString() === departmentId) {
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Cannot access this department'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authorization error',
      error: error.message
    });
  }
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessDepartment
};
```

### 4.2 Usage Example

```javascript
// routes/submissionRoutes.js

const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const { authenticate } = require('../middleware/authMiddleware');
const { hasPermission } = require('../middleware/authorizationMiddleware');
const { PERMISSIONS } = require('../constants/permissions');

// Create Phase I submission (Student only)
router.post(
  '/phase-i',
  authenticate,
  hasPermission(PERMISSIONS.SUBMISSION_CREATE),
  submissionController.createPhaseISubmission
);

// View all submissions (Super Admin and HoD)
router.get(
  '/all',
  authenticate,
  hasAnyPermission([
    PERMISSIONS.SUBMISSION_READ_ALL,
    PERMISSIONS.SUBMISSION_READ_DEPT
  ]),
  submissionController.getAllSubmissions
);

// Approve Phase II (HoD and Super Admin)
router.patch(
  '/phase-ii/:id/approve',
  authenticate,
  hasPermission(PERMISSIONS.APPROVAL_PHASE_II),
  submissionController.approvePhaseII
);

module.exports = router;
```

---

## 5. Frontend Permission Handling

### 5.1 React Permission Context

```javascript
// context/PermissionContext.js

import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();
  
  const ROLE_PERMISSIONS = {
    SUPER_ADMIN: ['*'], // All permissions
    HOD: [
      'department:read:own',
      'user:create:dept',
      'event:create:dept',
      'approval:phase_ii',
      'report:department',
      'excel:upload:dept'
    ],
    FACULTY: [
      'event:create',
      'submission:read:assigned',
      'report:assigned'
    ],
    STUDENT: [
      'event:read',
      'submission:create',
      'submission:read:own'
    ]
  };
  
  const userPermissions = ROLE_PERMISSIONS[user?.role] || [];
  
  const hasPermission = (permission) => {
    if (userPermissions.includes('*')) return true;
    return userPermissions.includes(permission);
  };
  
  const hasAnyPermission = (permissions) => {
    if (userPermissions.includes('*')) return true;
    return permissions.some(p => userPermissions.includes(p));
  };
  
  const hasAllPermissions = (permissions) => {
    if (userPermissions.includes('*')) return true;
    return permissions.every(p => userPermissions.includes(p));
  };
  
  return (
    <PermissionContext.Provider
      value={{
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        userPermissions
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};
```

### 5.2 Permission-Based Component Rendering

```javascript
// components/common/PermissionGuard.jsx

import React from 'react';
import { usePermissions } from '../../context/PermissionContext';

export const PermissionGuard = ({
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  children
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  }
  
  return hasAccess ? <>{children}</> : fallback;
};

// Usage Example:
// <PermissionGuard permission="event:create">
//   <CreateEventButton />
// </PermissionGuard>
```

---

## 6. Role-Based Dashboard Access

### 6.1 Dashboard Routing

| Role | Default Dashboard | Accessible Routes |
|------|------------------|-------------------|
| **Super Admin** | `/admin/dashboard` | All routes |
| **HoD** | `/hod/dashboard` | `/hod/*`, `/events/*`, `/reports/*` |
| **Faculty** | `/faculty/dashboard` | `/faculty/*`, `/events/*`, `/students/assigned` |
| **Student** | `/student/dashboard` | `/student/*`, `/events/*`, `/submissions/*` |

### 6.2 Route Protection Example

```javascript
// components/routes/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
};

export default ProtectedRoute;

// Usage:
// <Route
//   path="/admin/*"
//   element={
//     <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
//       <AdminDashboard />
//     </ProtectedRoute>
//   }
// />
```

---

## Document Information

- **Version:** 1.0
- **Last Updated:** December 2, 2025
- **Total Roles:** 4
- **Total Permission Categories:** 10
- **Status:** Production-ready

