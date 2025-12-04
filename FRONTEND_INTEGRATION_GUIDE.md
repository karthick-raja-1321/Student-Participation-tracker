# Frontend Integration Guide - On-Duty Approval System

## Overview
This guide provides step-by-step instructions for integrating the on-duty approval endpoints into the frontend application.

## API Endpoints Available

### Base URL: `http://localhost:5000/api/submissions`

1. **GET `/on-duty/pending`** - List pending on-duty submissions
   - Query Params: `departmentId`, `page`, `limit`
   - Returns: Array of submissions with student & event details

2. **POST `/:id/on-duty/approve`** - Approve on-duty submission
   - Body: `{ remarks: "optional approval notes" }`
   - Returns: Updated submission with new balance

3. **POST `/:id/on-duty/reject`** - Reject on-duty submission
   - Body: `{ remarks: "rejection reason" }`
   - Returns: Updated submission (no balance change)

---

## Implementation Tasks

### Task 1: Create On-Duty Approval Service
**File:** `client/src/utils/onDutyService.js` (NEW)

```javascript
import api from './api';

export const onDutyService = {
  // Get pending on-duty submissions for current HOD/Innovation Coordinator
  getPendingSubmissions: async (params = {}) => {
    try {
      const response = await api.get('/submissions/on-duty/pending', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
      throw error;
    }
  },

  // Approve an on-duty submission
  approveSubmission: async (submissionId, remarks = '') => {
    try {
      const response = await api.post(`/submissions/${submissionId}/on-duty/approve`, {
        remarks
      });
      return response.data.data;
    } catch (error) {
      console.error('Error approving submission:', error);
      throw error;
    }
  },

  // Reject an on-duty submission
  rejectSubmission: async (submissionId, remarks = '') => {
    try {
      const response = await api.post(`/submissions/${submissionId}/on-duty/reject`, {
        remarks
      });
      return response.data.data;
    } catch (error) {
      console.error('Error rejecting submission:', error);
      throw error;
    }
  }
};
```

---

### Task 2: Create On-Duty Approval Dashboard Component
**File:** `client/src/pages/approvals/OnDutyApprovalDashboard.jsx` (NEW)

**Features:**
- Display list of pending on-duty submissions
- Show student info, event, current balance
- Approve/Reject buttons with remarks modal
- Pagination support
- Filters: Department (if HOD), Status

**Key Components:**
1. **Submission Table** - Show:
   - Student name, roll number, department
   - Event title
   - Current on-duty balance (availed/total)
   - Action buttons (Approve/Reject)
   
2. **Approval Modal** - Show:
   - Student full details
   - Event information
   - Current on-duty balance with preview
   - Remarks text area
   - Confirm/Cancel buttons

3. **Error Handling**
   - Show toast on approval/rejection success
   - Handle authorization errors
   - Retry mechanism for failed requests

---

### Task 3: Add On-Duty Balance Display
**Files to Update:**
- `client/src/pages/dashboard/StudentDashboard.jsx`
- `client/src/pages/events/EventDetails.jsx`

**Changes:**
1. **StudentDashboard** - Add card:
   ```
   On-Duty Sessions
   ├─ Total Allowed: 7
   ├─ Availed: X
   └─ Balance: 7-X
   ```

2. **EventDetails** - Show warning on registration:
   ```
   "This will count as 1 of your 7 on-duty sessions"
   "Warning: You have X on-duty sessions left"
   ```

---

### Task 4: Add On-Duty Flag to Event Registration
**File:** `client/src/components/EventRegistration.jsx` (MODIFY)

**Changes:**
1. Add checkbox: "Is this participation for on-duty?"
2. Show warning if checked:
   - "This will use 1 of your remaining balance on-duty sessions"
   - Display current balance
   - Disable if balance = 0

3. Pass `isOnDuty: true` when submitting Phase II

---

### Task 5: Add To-Do Badge for HOD/Coordinators
**File:** `client/src/pages/Sidebar.jsx` (MODIFY)

**Changes:**
1. Add notification badge to Approvals menu item
2. Show count of pending on-duty submissions
3. Badge styled in red if count > 0

---

## Usage Example

### Step 1: Call API to get pending submissions
```javascript
import { onDutyService } from '../utils/onDutyService';

const [submissions, setSubmissions] = useState([]);

useEffect(() => {
  const fetchPending = async () => {
    try {
      const data = await onDutyService.getPendingSubmissions({ page: 1, limit: 10 });
      setSubmissions(data.submissions);
    } catch (error) {
      toast.error('Failed to load pending submissions');
    }
  };
  
  fetchPending();
}, []);
```

### Step 2: Approve submission with remarks
```javascript
const handleApprove = async (submissionId, remarks) => {
  try {
    const result = await onDutyService.approveSubmission(submissionId, remarks);
    
    // Show updated balance
    console.log('New Balance:', result.studentUpdate.onDutyBalance);
    
    // Refresh list
    setSubmissions(submissions.filter(s => s._id !== submissionId));
    
    toast.success('On-duty submission approved! Balance updated.');
  } catch (error) {
    toast.error('Failed to approve submission');
  }
};
```

### Step 3: Reject submission with reason
```javascript
const handleReject = async (submissionId, remarks) => {
  try {
    await onDutyService.rejectSubmission(submissionId, remarks);
    
    // Refresh list
    setSubmissions(submissions.filter(s => s._id !== submissionId));
    
    toast.success('On-duty submission rejected');
  } catch (error) {
    toast.error('Failed to reject submission');
  }
};
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────┐
│  HOD/Innovation Coordinator Login        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Navigate to On-Duty Approval Dashboard  │
└──────────────┬──────────────────────────┘
               │
               ▼
       GET /submissions/on-duty/pending
               │
               ▼
┌─────────────────────────────────────────┐
│  Display Pending On-Duty Submissions     │
│  - Show student balance (availed/total)  │
│  - Display event info                    │
└──────────────┬──────────────────────────┘
               │
     ┌─────────┴─────────┐
     │                   │
     ▼                   ▼
  Approve             Reject
     │                   │
     ▼                   ▼
POST /approve         POST /reject
     │                   │
     ▼                   ▼
Update Balance       No Change
availed++            Balance
balance--            Stays Same
```

---

## Testing Workflow

### Scenario: Approve On-Duty Submission

1. **Setup:**
   - Create a student submission with `isOnDuty: true`
   - Set `onDutyApprovalStatus: 'PENDING'`
   - Student balance: `{ totalAllowed: 7, availed: 2, balance: 5 }`

2. **Test Approval:**
   ```bash
   # Call API to approve
   POST /submissions/{submissionId}/on-duty/approve
   { "remarks": "Approved" }
   ```

3. **Verify:**
   - Student balance updated:
     - availed: 2 → 3
     - balance: 5 → 4
   - Submission status: APPROVED
   - Approver ID recorded

4. **Expected Response:**
   ```json
   {
     "status": "success",
     "data": {
       "submission": { /* updated submission */ },
       "studentUpdate": {
         "onDutyAvailed": 3,
         "onDutyBalance": 4,
         "totalAllowed": 7
       }
     },
     "message": "On-duty submission approved successfully..."
   }
   ```

---

## Error Scenarios to Handle

| Error | Status | Handling |
|-------|--------|----------|
| Submission not found | 404 | Show "Submission not found" toast |
| Already approved/rejected | 400 | Show "Cannot modify completed submissions" |
| Not authorized (wrong dept) | 403 | Show "You can only approve submissions from your department" |
| User not faculty | 403 | Show "You don't have permission to approve" |
| Database error | 500 | Show "Server error - try again later" |

---

## Integration Checklist

- [ ] Create `onDutyService.js` utility
- [ ] Create `OnDutyApprovalDashboard.jsx` component
- [ ] Add route in `client/src/routes/index.jsx`
- [ ] Update navigation/sidebar with link
- [ ] Add on-duty balance display in StudentDashboard
- [ ] Add on-duty checkbox in EventRegistration
- [ ] Add notification badge in sidebar
- [ ] Test approval flow end-to-end
- [ ] Test rejection flow end-to-end
- [ ] Test error scenarios
- [ ] Test with multiple students/departments
- [ ] Performance test with large dataset

---

## Notes

1. **Balance Calculation:** Always shown as `totalAllowed - availed` (handled server-side)
2. **Rejections:** Don't change balance - students can resubmit
3. **Authorization:** Verified server-side by department matching
4. **Notifications:** Should notify student of approval/rejection (integrate with notification system)
5. **Audit Trail:** Approver ID and timestamp recorded in submission

---

## Status: READY FOR IMPLEMENTATION

Backend APIs are fully functional. Ready for frontend integration.
