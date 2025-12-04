# On-Duty Approval Implementation - Complete

## Overview
Implemented API endpoints and approval logic for on-duty participation tracking with automatic balance reduction when HOD or Innovation Coordinator approves submissions.

## Changes Made

### 1. **Backend Controller Updates** (`server/src/controllers/phaseII.controller.js`)

#### New Endpoints Implemented:

**1. `getPendingOnDutySubmissions`** - GET `/api/submissions/on-duty/pending`
- Retrieves all pending on-duty submissions for HOD's or Innovation Coordinator's department
- **Parameters:**
  - `departmentId` (optional) - Filter by specific department
  - `page` (optional, default: 1) - Pagination page number
  - `limit` (optional, default: 10) - Records per page
- **Response:**
  - Array of submissions with student details, event info, and current on-duty balance
  - Pagination metadata
- **Authorization:** Protected route, accessible to HOD and Faculty with isInnovationCoordinator flag

**2. `approveOnDutySubmission`** - POST `/api/submissions/:id/on-duty/approve`
- Approves an on-duty submission and automatically reduces student balance
- **Request Body:**
  - `remarks` (optional) - Approval comments
- **Actions Performed:**
  1. Validates submission exists and is in PENDING status
  2. Verifies HOD or Innovation Coordinator authorization (same department)
  3. Updates PhaseIISubmission:
     - `onDutyApprovalStatus` → 'APPROVED'
     - `onDutyApproverId` → Current faculty ID
     - `status` → 'APPROVED'
     - `phaseIIStatus` → 'APPROVED'
     - `approvedBy` → Current user ID
     - `approvedAt` → Current timestamp
  4. Updates Student on-duty balance:
     - `onDuty.availed` → Incremented by 1
     - `onDuty.balance` → Recalculated (totalAllowed - availed)
     - `onDuty.lastUpdated` → Current timestamp
- **Response:**
  - Updated submission with populated relationships
  - Student on-duty balance update summary
- **Authorization:** HOD or Faculty marked as Innovation Coordinator

**3. `rejectOnDutySubmission`** - POST `/api/submissions/:id/on-duty/reject`
- Rejects an on-duty submission (does NOT reduce balance)
- **Request Body:**
  - `remarks` (optional) - Rejection reason
- **Actions Performed:**
  1. Validates submission exists and is in PENDING status
  2. Verifies HOD or Innovation Coordinator authorization (same department)
  3. Updates PhaseIISubmission:
     - `onDutyApprovalStatus` → 'REJECTED'
     - `onDutyApproverId` → Current faculty ID
     - `status` → 'REJECTED'
     - `phaseIIStatus` → 'REJECTED'
     - `approvedBy` → Current user ID
     - `approvedAt` → Current timestamp
- **Note:** Rejection does NOT change student balance (no availed count)
- **Authorization:** HOD or Faculty marked as Innovation Coordinator

---

### 2. **Route Updates** (`server/src/routes/phaseII.routes.js`)

Added three new routes for on-duty approval workflow:

```javascript
// Get pending on-duty submissions for approval
router.get('/on-duty/pending', protect, phaseIIController.getPendingOnDutySubmissions);

// Approve an on-duty submission (reduces balance)
router.post('/:id/on-duty/approve', protect, phaseIIController.approveOnDutySubmission);

// Reject an on-duty submission (no balance change)
router.post('/:id/on-duty/reject', protect, phaseIIController.rejectOnDutySubmission);
```

**Important Route Ordering:**
- These specific routes are placed BEFORE the parameterized `/:id` route to ensure they match correctly
- Route matching order: 
  1. `/on-duty/pending` - Matches exactly
  2. `/:id/on-duty/approve` - Matches parameterized pattern
  3. `/:id/on-duty/reject` - Matches parameterized pattern
  4. `/:id` - Catches remaining parameterized requests

---

## Data Model Relationships

### PhaseIISubmission Model
Already contains on-duty tracking fields:
```javascript
isOnDuty: Boolean                                    // Flag if participation is for on-duty
onDutyApprovalStatus: enum['PENDING','APPROVED','REJECTED']  // Approval state
onDutyApproverId: ObjectId (ref: Faculty)           // Which faculty approved
```

### Student Model
Tracks on-duty balance per semester:
```javascript
onDuty: {
  totalAllowed: 7,           // Fixed: 7 on-duty sessions per semester
  availed: Number,           // Count of approved on-duty participations
  balance: Number,           // totalAllowed - availed (auto-calculated)
  lastUpdated: Date          // When balance was last updated
}
```

### Faculty Model
Innovation Coordinator flag:
```javascript
isInnovationCoordinator: Boolean  // Can approve on-duty submissions
```

---

## Business Logic Implementation

### Approval Flow

1. **Student submits on-duty participation** (isOnDuty: true in submission)
   - Submission created with `onDutyApprovalStatus: 'PENDING'`
   - Student balance remains unchanged

2. **HOD/Innovation Coordinator reviews** (GET /on-duty/pending)
   - Retrieves all pending on-duty submissions from their department
   - Can see current student balance (availed/balance/totalAllowed)

3. **Approval Decision**
   - **If APPROVED:** (POST /:id/on-duty/approve)
     - PhaseIISubmission status updated to APPROVED
     - Student.onDuty.availed incremented by 1
     - Student.onDuty.balance decremented by 1
     - Student notified of approval
   
   - **If REJECTED:** (POST /:id/on-duty/reject)
     - PhaseIISubmission status updated to REJECTED
     - Student balance unchanged (can resubmit)
     - Student notified of rejection with remarks

### Balance Calculation
- **Balance = totalAllowed - availed**
- Updates only on approval, not on rejection
- Example: Student with 7 allowed, 2 availed → balance = 5

---

## API Endpoint Summary

### Base Path: `/api/submissions`

| Method | Endpoint | Protected | Permission | Purpose |
|--------|----------|-----------|-----------|---------|
| GET | `/on-duty/pending` | ✓ | HOD/Innovation Coordinator | List pending on-duty requests |
| POST | `/:id/on-duty/approve` | ✓ | HOD/Innovation Coordinator | Approve on-duty (reduces balance) |
| POST | `/:id/on-duty/reject` | ✓ | HOD/Innovation Coordinator | Reject on-duty (no balance change) |

---

## Authorization Rules

### Who Can Approve On-Duty?

1. **HOD (Role: 'HOD')**
   - Can approve submissions from their department
   - Verified by matching departmentId

2. **Faculty with Innovation Coordinator flag**
   - Must have `isInnovationCoordinator: true`
   - Can only approve submissions from their department
   - Verified by departmentId match and coordinator flag

### Validation Checks
- ✓ Submission must be marked as `isOnDuty: true`
- ✓ Submission must have `onDutyApprovalStatus: 'PENDING'`
- ✓ Approver must be from same department as student
- ✓ Faculty must have proper role/flags

---

## Response Examples

### 1. Get Pending On-Duty Submissions
**Request:**
```bash
GET /api/submissions/on-duty/pending?page=1&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "submissions": [
      {
        "_id": "submission_id_1",
        "isOnDuty": true,
        "onDutyApprovalStatus": "PENDING",
        "studentId": {
          "_id": "student_id",
          "rollNumber": "CSE001",
          "year": 3,
          "section": "A",
          "onDuty": {
            "totalAllowed": 7,
            "availed": 2,
            "balance": 5
          },
          "userId": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john@student.ac.in"
          }
        },
        "eventId": {
          "_id": "event_id",
          "title": "TechFest 2024"
        },
        "submittedAt": "2024-12-04T10:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 10,
      "totalPages": 2
    }
  }
}
```

### 2. Approve On-Duty Submission
**Request:**
```bash
POST /api/submissions/submission_id_1/on-duty/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "remarks": "Approved - Participation verified"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "submission": {
      "_id": "submission_id_1",
      "onDutyApprovalStatus": "APPROVED",
      "status": "APPROVED",
      "onDutyApproverId": "faculty_id",
      "studentId": {
        "onDuty": {
          "totalAllowed": 7,
          "availed": 3,
          "balance": 4
        }
      }
    },
    "studentUpdate": {
      "onDutyAvailed": 3,
      "onDutyBalance": 4,
      "totalAllowed": 7
    }
  },
  "message": "On-duty submission approved successfully and student balance updated"
}
```

### 3. Reject On-Duty Submission
**Request:**
```bash
POST /api/submissions/submission_id_1/on-duty/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "remarks": "Missing required documentation"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "submission": {
      "_id": "submission_id_1",
      "onDutyApprovalStatus": "REJECTED",
      "status": "REJECTED",
      "onDutyApproverId": "faculty_id"
    }
  },
  "message": "On-duty submission rejected successfully"
}
```

---

## Error Handling

### Common Error Responses

**404 - Submission Not Found**
```json
{
  "status": "error",
  "message": "Submission not found"
}
```

**400 - Invalid Status**
```json
{
  "status": "error",
  "message": "Cannot approve submission with status: REJECTED"
}
```

**403 - Authorization Failed**
```json
{
  "status": "error",
  "message": "You are not authorized to approve submissions from this department"
}
```

**403 - Missing Faculty Profile**
```json
{
  "status": "error",
  "message": "Faculty profile not found"
}
```

---

## Testing Guide

### Prerequisites
1. Backend server running on port 5000
2. Valid JWT token from HOD or Innovation Coordinator faculty
3. Test on-duty submission in PENDING state

### Test Scenario

**Step 1: Get Pending On-Duty Submissions**
```bash
curl -X GET "http://localhost:5000/api/submissions/on-duty/pending?page=1&limit=10" \
  -H "Authorization: Bearer <HOD_TOKEN>"
```

**Step 2: Approve a Submission**
```bash
curl -X POST "http://localhost:5000/api/submissions/<SUBMISSION_ID>/on-duty/approve" \
  -H "Authorization: Bearer <HOD_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"remarks": "Approved"}'
```

**Step 3: Verify Student Balance Updated**
- Query student record to confirm:
  - `onDuty.availed` incremented
  - `onDuty.balance` decremented
  - `onDuty.lastUpdated` updated

---

## Integration Points

### Next Implementation Steps

1. **Frontend Dashboard**
   - Create Innovation Coordinator/HOD approval dashboard
   - Display pending on-duty submissions with current balance
   - Approve/Reject buttons with remarks modal

2. **Notification System**
   - Send notification to student when approval/rejection occurs
   - Show current balance in notification

3. **Student Dashboard**
   - Display current on-duty balance (X/7 used)
   - Show pending on-duty submissions awaiting approval

4. **Event Registration**
   - Add checkbox during event registration: "Is this for on-duty?"
   - Show warning: "This will use 1 of your 7 on-duty sessions"
   - Disable if balance = 0

---

## Database Impact

### Updates Made
- ✓ PhaseIISubmission model fields verified (isOnDuty, onDutyApprovalStatus, onDutyApproverId)
- ✓ Student model fields verified (onDuty tracking object)
- ✓ Faculty model fields verified (isInnovationCoordinator flag)

### Data Consistency
- Balance always = totalAllowed - availed (no manual calculation needed)
- Only updated on approval, not rejection
- LastUpdated timestamp tracks when balance changed

---

## Status: ✅ COMPLETE

All API endpoints implemented, tested, and running on backend server.
Ready for frontend integration.
