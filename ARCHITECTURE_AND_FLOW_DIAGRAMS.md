# Phase 1 Architecture & Flow Diagrams

## 1. Auto-Save System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Form Component (Formik)                   │   │
│  │  - On-Duty Process                                   │   │
│  │  - Event Participation Proof                         │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                           │
│                   │ Form Value Changes                        │
│                   ▼                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        useEffect Hook Triggers                       │   │
│  │    (Watches for formik.values changes)               │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                           │
│                   │ setTimeout(2000ms)                        │
│                   ▼                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    Auto-Save Utility (autoSave.js)                  │   │
│  │  - autoSaveFormData()                                │   │
│  │  - Debounce mechanism (2 second delay)              │   │
│  └────────────────┬─────────────────────────────────────┘   │
│                   │                                           │
│                   │ Store Data                                │
│                   ▼                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      Browser LocalStorage                            │   │
│  │  Key: form_on-duty-process-form                     │   │
│  │  Key: form_event-participation-proof-form           │   │
│  │  Value: { ...formData, timestamp: Date }            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │    Auto-Save Status Indicator                        │   │
│  │  "✓ Auto-saved" or "Form restored from session"     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Approval Workflow - Complete Flow

```
STUDENT
   │
   ├─► Fills "On-Duty Process" Form
   │   │
   │   ├─► Auto-Save (every 2 seconds)
   │   │
   │   └─► Submits Form
   │       │
   │       ▼
   │    Backend Storage
   │
   ▼
CLASS ADVISOR
   │
   ├─► Access Dashboard: /dashboard/class-advisor
   │   │
   │   ├─► View Statistics
   │   │   ├─ Total Students: 45
   │   │   ├─ Approved: 12
   │   │   ├─ Pending: 8
   │   │   └─ Rejected: 2
   │   │
   │   ├─► View Submissions Table
   │   │   ├─ Student Name, Register Number
   │   │   ├─ Event Title
   │   │   ├─ Submission Date
   │   │   └─ Status Chip (color-coded)
   │   │
   │   ├─► Filter by Status (Optional)
   │   │
   │   └─► Click "Review" on Pending Submission
   │       │
   │       ├─► Dialog Opens
   │       │   ├─ Student Info
   │       │   ├─ Event Info
   │       │   ├─ Approve/Reject Dropdown
   │       │   ├─ Select Innovation Coordinator
   │       │   └─ Add Comments
   │       │
   │       └─► Click "Approve" or "Reject"
   │           │
   │           ▼
   │        POST /approvals/submit-approval
   │           │
   │           ├─ submissionId
   │           ├─ status (APPROVED/REJECTED)
   │           ├─ comments
   │           ├─ mentorId (Coordinator ID)
   │           └─ role: CLASS_ADVISOR
   │
   ▼
INNOVATION COORDINATOR
   │
   ├─► Access Dashboard: /dashboard/innovation-coordinator
   │   │
   │   ├─► View Statistics
   │   │   ├─ Under Review: 5
   │   │   ├─ Approved: 28
   │   │   ├─ Prize Awards: 12
   │   │   └─ Verified: 28
   │   │
   │   ├─► Tab 1: Phase I (On-Duty Process)
   │   │   ├─ View Phase I Submissions
   │   │   ├─ Status Filtering
   │   │   │
   │   │   └─► Click "Review"
   │   │       │
   │   │       ├─ Dialog: Student Info
   │   │       ├─ Dialog: Event Info
   │   │       ├─ Dialog: Participation Type
   │   │       ├─ Dialog: Approve/Reject
   │   │       ├─ Dialog: Comments
   │   │       │
   │   │       └─► Click "Submit"
   │   │           │
   │   │           ▼
   │   │        POST /approvals/approve-phase-i
   │   │
   │   ├─► Tab 2: Phase II (Event Participation Proof)
   │   │   ├─ View Phase II Submissions
   │   │   ├─ Status Filtering
   │   │   │
   │   │   └─► Click "Review"
   │   │       │
   │   │       ├─ Dialog: Student Info
   │   │       ├─ Dialog: Result (Winner/Finalist/etc)
   │   │       ├─ Dialog: Prize Amount
   │   │       ├─ Dialog: Verify/Reject
   │   │       ├─ Dialog: Comments
   │   │       │
   │   │       └─► Click "Submit"
   │   │           │
   │   │           ▼
   │   │        POST /approvals/approve-phase-ii
   │   │
   │   └─► Table Updates in Real-time
   │
   ▼
FINAL APPROVAL
   │
   ├─► Status Updated in Backend
   ├─► Notification Sent to Student
   │   ├─ If APPROVED: "You can now submit Phase II"
   │   └─ If REJECTED: "Submission rejected with reason..."
   │
   └─► Records Updated
       └─ Event Participation Tracked
           Prize Awards Recorded
```

---

## 3. Dashboard Data Flow

### Class Advisor Dashboard

```
┌─────────────────────────────────────────────────────┐
│   Class Advisor Dashboard Mount                      │
│   /dashboard/class-advisor                           │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   GET /approvals/    GET /approvals/
   class-advisor-     class-advisor-
   stats              submissions
        │                 │
        ▼                 ▼
   Stats Data         Submissions Array
   - totalStudents    - studentId
   - approved         - eventId
   - pending          - approvalStatus
   - rejected         - createdAt
        │                 │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │                 │
        ▼                 ▼
   Statistics Cards    Submissions Table
   (4 cards)           with Chips & Buttons
        │
        └─► On "Review" Click
            │
            ├─► Open Dialog
            │
            ├─► GET /faculty
            │   └─ Load Coordinators
            │
            └─► On Submit
                │
                ▼
            POST /approvals/
            submit-approval
                │
                └─► Refresh Data
                    - GET stats
                    - GET submissions
```

### Innovation Coordinator Dashboard

```
┌──────────────────────────────────────────────────────┐
│   Innovation Coordinator Dashboard Mount              │
│   /dashboard/innovation-coordinator                   │
└────────────────┬─────────────────────────────────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
     ▼           ▼           ▼
   Stats      Phase I      Phase II
   GET        GET          GET
   /approvals/ /approvals/ /approvals/
   innovation- innovation- innovation-
   coordinator coordinator coordinator
   -stats      -phase-i    -phase-ii
     │           │           │
     ▼           ▼           ▼
  Stats       Phase I      Phase II
  Data        Submissions  Submissions
  - reviewing - Status     - Status
  - approved  - Student    - Result
  - rejected  - Event      - Prize
  - prizes    - Type       - Amount
     │           │           │
     └───────────┼───────────┘
                 │
        ┌────────▼────────┐
        │                 │
        ▼                 ▼
  Statistics Cards    Two-Tab Interface
  (4 cards)           Tab 1: Phase I
                      Tab 2: Phase II
        │
        ├─► Filter by Status
        │   - ALL
        │   - PENDING
        │   - APPROVED
        │   - REJECTED
        │
        └─► On "Review" Click
            │
            ├─► Open Dialog
            │   (Context-aware for Phase I/II)
            │
            └─► On Submit
                │
                ▼
            POST /approvals/
            approve-phase-i or
            approve-phase-ii
                │
                └─► Refresh Data
                    - GET stats
                    - GET submissions
```

---

## 4. Component Hierarchy

```
MainLayout
│
├─► Routes Configuration
│   │
│   ├─► /dashboard/class-advisor
│   │   └─► ClassAdvisorDashboard.jsx
│   │       ├─ useEffect (fetch data)
│   │       ├─ useState (stats, submissions, etc)
│   │       ├─ Grid (Layout)
│   │       ├─ Card (Statistics)
│   │       ├─ Table (Submissions)
│   │       ├─ TextField (Filters)
│   │       └─ Dialog (Approval Form)
│   │
│   ├─► /dashboard/innovation-coordinator
│   │   └─► InnovationCoordinatorDashboard.jsx
│   │       ├─ useEffect (fetch data)
│   │       ├─ useState (stats, phase I/II, etc)
│   │       ├─ Grid (Layout)
│   │       ├─ Card (Statistics)
│   │       ├─ Tabs (Phase I / Phase II)
│   │       ├─ Table (Submissions)
│   │       ├─ TextField (Filters)
│   │       └─ Dialog (Verification Form)
│   │
│   ├─► /on-duty/new
│   │   └─► PhaseISubmission.jsx
│   │       ├─ useFormik (Form State)
│   │       ├─ useEffect (Auto-save)
│   │       ├─ Stepper (Form Steps)
│   │       ├─ TextField (Form Fields)
│   │       └─ Auto-Save Status
│   │
│   └─► /participation-proof/:id
│       └─► PhaseIISubmission.jsx
│           ├─ useFormik (Form State)
│           ├─ useEffect (Auto-save)
│           ├─ Grid (Form Layout)
│           ├─ TextField (Form Fields)
│           ├─ FileInput (Uploads)
│           └─ Auto-Save Status
│
└─► Utilities
    │
    ├─► autoSave.js
    │   ├─ autoSaveFormData()
    │   ├─ getAutoSavedFormData()
    │   ├─ clearAutoSavedFormData()
    │   ├─ hasAutoSavedData()
    │   ├─ getAllAutoSavedForms()
    │   └─ useAutoSave() hook
    │
    └─► api.js (axios instance)
        ├─ GET /approvals/class-advisor-stats
        ├─ GET /approvals/class-advisor-submissions
        ├─ POST /approvals/submit-approval
        ├─ GET /approvals/innovation-coordinator-stats
        ├─ GET /approvals/innovation-coordinator-phase-i
        ├─ GET /approvals/innovation-coordinator-phase-ii
        ├─ POST /approvals/approve-phase-i
        ├─ POST /approvals/approve-phase-ii
        └─ GET /faculty
```

---

## 5. Data Persistence Flow

```
ON-DUTY PROCESS FORM
     │
     ├─► User Enters Data
     │   │
     │   ▼
     ├─► formik.values Updated
     │   │
     │   ▼
     ├─► useEffect Triggered (Debounce: 2s)
     │   │
     │   ▼
     ├─► autoSaveFormData() Called
     │   │
     │   ▼
     ├─► localStorage.setItem()
     │   ├─ Key: "form_on-duty-process-form"
     │   ├─ Value: JSON.stringify({
     │   │    eventId: "...",
     │   │    participationType: "...",
     │   │    ...,
     │   │    timestamp: Date.now()
     │   │  })
     │   │
     │   ▼
     ├─► State Update: setAutoSaveStatus('saved')
     │   │
     │   ▼
     ├─► UI Update: Show "✓ Auto-saved"
     │   │
     │   ▼ (After 3 seconds)
     │   
     └─► Hide Status Indicator

ON PAGE RELOAD/REFRESH
     │
     ├─► Component Mounts
     │   │
     │   ▼
     ├─► useEffect Runs
     │   │
     │   ▼
     ├─► getAutoSavedFormData() Called
     │   │
     │   ▼
     ├─► localStorage.getItem("form_on-duty-process-form")
     │   │
     │   ▼ (If data exists)
     │   
     ├─► Parse JSON Data
     │   │
     │   ▼
     ├─► Load into Form State
     │   │
     │   ▼
     └─► Show "Form restored from previous session"

ON FORM SUBMISSION
     │
     ├─► User Clicks Submit
     │   │
     │   ▼
     ├─► POST /registrations (or similar)
     │   │
     │   ▼ (If Success)
     │   
     ├─► clearAutoSavedFormData() Called
     │   │
     │   ▼
     ├─► localStorage.removeItem("form_on-duty-process-form")
     │   │
     │   ▼
     ├─► Show Success Toast
     │   │
     │   ▼
     └─► Navigate to /submissions
```

---

## 6. API Request/Response Cycle

```
Frontend Component
     │
     ├─► User Action Triggered
     │   (Click "Review" button)
     │   │
     │   ▼
     ├─► Dialog Opened
     │   │
     │   ▼
     ├─► User Fills Form
     │   ├─ Select Coordinator
     │   ├─ Choose Action
     │   ├─ Add Comments
     │   │
     │   ▼
     ├─► Click Submit Button
     │   │
     │   ▼
     └─► POST /approvals/submit-approval
         │
         ├─ Headers:
         │  ├─ Authorization: "Bearer <token>"
         │  └─ Content-Type: "application/json"
         │
         ├─ Body:
         │  ├─ submissionId: "..."
         │  ├─ status: "APPROVED" or "REJECTED"
         │  ├─ comments: "..."
         │  ├─ mentorId: "..."
         │  └─ role: "CLASS_ADVISOR"
         │
         ▼
Backend Server
     │
     ├─► Validate Request
     │   ├─ Check JWT Token
     │   ├─ Verify User Role
     │   ├─ Validate Submission ID
     │   └─ Validate Mentor ID
     │
     ├─► Update Database
     │   ├─ Update submission status
     │   ├─ Store comments
     │   ├─ Assign mentor
     │   └─ Record timestamp
     │
     ├─► Create Notification
     │   └─ Notify Innovation Coordinator
     │
     └─► Return Response
         │
         ├─ Status: 200 OK
         │
         └─ Body:
            {
              status: "success",
              message: "Approval submitted",
              data: {
                submissionId: "...",
                updatedStatus: "APPROVED",
                approvedBy: "...",
                assignedTo: "..."
              }
            }

Frontend Component (Continued)
     │
     ├─► Receive Response
     │   │
     │   ▼
     ├─► Show Toast Notification
     │   │ "Approval submitted successfully!"
     │   │
     │   ▼
     ├─► Close Dialog
     │   │
     │   ▼
     ├─► Refresh Dashboard Data
     │   │
     │   ├─► GET /approvals/class-advisor-stats
     │   ├─► GET /approvals/class-advisor-submissions
     │   │
     │   ▼
     └─► Update Table View
         └─ Submission status changes
```

---

## 7. State Management Overview

```
Component State (React Hooks)
│
├─ Statistics State
│  ├─ stats.totalStudents
│  ├─ stats.submissionsApproved
│  ├─ stats.submissionsPending
│  └─ stats.submissionsRejected
│
├─ Submissions State
│  ├─ submissions[] (array of submission objects)
│  └─ filteredSubmissions[] (based on status filter)
│
├─ UI State
│  ├─ loading (boolean)
│  ├─ openDialog (boolean)
│  ├─ selectedSubmission (object)
│  ├─ filterStatus (string)
│  └─ autoSaveStatus (string)
│
├─ Form State (in Dialog)
│  ├─ approvalData.status
│  ├─ approvalData.comments
│  ├─ approvalData.mentorId (Class Advisor only)
│  └─ approvalData.role
│
├─ Faculty Data
│  └─ faculty[] (array of coordinator objects)
│
└─ Form Auto-Save State (PhaseISubmission/PhaseIISubmission)
   ├─ formik.values (form field values)
   ├─ autoSaveStatus (string)
   └─ localStorage (persistent storage)
```

---

## 8. Error Handling Flow

```
API Request
     │
     ├─► Try Block
     │   │
     │   ├─ api.get() or api.post()
     │   │
     │   ▼ (If Success)
     │   
     ├─► Parse Response
     │   ├─ Extract data
     │   ├─ Update state
     │   └─ Show success toast
     │
     └─► Catch Block
         │
         ├─ Check Error Type
         │  ├─ Network Error
         │  ├─ API Error (4xx, 5xx)
         │  └─ Parsing Error
         │
         ├─ Extract Error Message
         │  ├─ err.response?.data?.message
         │  ├─ err.response?.status
         │  └─ Fallback message
         │
         ├─ Log Error
         │  └─ console.error()
         │
         └─ Show Error Toast
            └─ toast.error("Error message")

Finally Block
     │
     └─► setLoading(false)
         └─ Reset loading state
```

---

## Summary

- **Auto-Save:** Runs every 2 seconds, stores in localStorage, restores on page reload
- **Dashboards:** Fetch data on mount, filter dynamically, real-time updates
- **Approvals:** Multi-step process with Class Advisor → Innovation Coordinator flow
- **Error Handling:** Try-catch blocks with user-friendly error messages
- **State Management:** React hooks for local component state, redux for auth
- **Data Persistence:** localStorage for forms, backend for submissions

