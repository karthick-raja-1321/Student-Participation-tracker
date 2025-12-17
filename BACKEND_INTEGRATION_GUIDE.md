# Backend Integration Guide - Phase 1 Implementation

## Overview
This guide outlines all the API endpoints that need to be implemented or updated to support the Phase 1 features (Auto-save dashboards, form renaming, role-based approvals).

---

## 1. Class Advisor Dashboard Endpoints

### 1.1 Get Dashboard Statistics
**Endpoint:** `GET /approvals/class-advisor-stats`

**Purpose:** Fetch aggregated statistics for the Class Advisor dashboard

**Request:**
```javascript
GET /approvals/class-advisor-stats
Headers: { Authorization: "Bearer <token>" }
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "totalStudents": 45,
    "submissionsApproved": 12,
    "submissionsPending": 8,
    "submissionsRejected": 2
  }
}
```

**Implementation Notes:**
- Count total students assigned to this class advisor
- Count Phase I submissions with status APPROVED
- Count Phase I submissions with status PENDING
- Count Phase I submissions with status REJECTED
- Filter by current user's class/department

---

### 1.2 Get Class Advisor Submissions
**Endpoint:** `GET /approvals/class-advisor-submissions`

**Purpose:** Fetch all submissions for class advisor to review

**Request:**
```javascript
GET /approvals/class-advisor-submissions
Headers: { Authorization: "Bearer <token>" }
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "submissions": [
      {
        "_id": "submission_id",
        "studentId": {
          "_id": "student_id",
          "firstName": "John",
          "lastName": "Doe",
          "registerNumber": "REG001"
        },
        "eventId": {
          "_id": "event_id",
          "title": "Tech Summit 2025"
        },
        "approvalStatus": "PENDING",
        "createdAt": "2025-01-15T10:30:00Z",
        "participationType": "INDIVIDUAL"
      }
    ]
  }
}
```

**Implementation Notes:**
- Fetch Phase I submissions for students in this advisor's class
- Include student details (firstName, lastName, registerNumber)
- Include event details (title)
- Include approval status
- Include submission date (createdAt)
- Sort by createdAt descending (newest first)

---

### 1.3 Submit Class Advisor Approval
**Endpoint:** `POST /approvals/submit-approval`

**Purpose:** Submit class advisor's approval/rejection decision

**Request:**
```javascript
POST /approvals/submit-approval
Headers: { 
  Authorization: "Bearer <token>",
  Content-Type: "application/json" 
}
Body: {
  "submissionId": "phase1_submission_id",
  "status": "APPROVED", // or "REJECTED"
  "comments": "This student has met all requirements",
  "mentorId": "innovation_coordinator_id",
  "role": "CLASS_ADVISOR"
}
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Approval submitted successfully",
  "data": {
    "submissionId": "phase1_submission_id",
    "updatedStatus": "APPROVED",
    "approvedBy": "class_advisor_id",
    "assignedTo": "innovation_coordinator_id"
  }
}
```

**Implementation Notes:**
- Validate submissionId exists and belongs to student in advisor's class
- Update submission approvalStatus to provided status
- Store approvalStatus, approvalComments, approvedBy, assignedMentor
- Validate mentorId is valid Innovation Coordinator
- Create notification for assigned Innovation Coordinator if status is APPROVED
- Create notification for student if status is REJECTED with comments
- Verify current user is CLASS_ADVISOR role

---

## 2. Innovation Coordinator Dashboard Endpoints

### 2.1 Get Innovation Coordinator Statistics
**Endpoint:** `GET /approvals/innovation-coordinator-stats`

**Purpose:** Fetch dashboard statistics for Innovation Coordinator

**Request:**
```javascript
GET /approvals/innovation-coordinator-stats
Headers: { Authorization: "Bearer <token>" }
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "submissionsReviewing": 5,
    "submissionsApproved": 28,
    "submissionsRejected": 3,
    "prizeAwards": 12
  }
}
```

**Implementation Notes:**
- Count Phase I submissions assigned to this coordinator with status PENDING
- Count Phase I submissions assigned to this coordinator with status APPROVED
- Count Phase I submissions assigned to this coordinator with status REJECTED
- Count Phase II submissions where prizeAmount > 0

---

### 2.2 Get Phase I Submissions for Innovation Coordinator
**Endpoint:** `GET /approvals/innovation-coordinator-phase-i`

**Purpose:** Fetch Phase I submissions assigned to this coordinator

**Request:**
```javascript
GET /approvals/innovation-coordinator-phase-i
Headers: { Authorization: "Bearer <token>" }
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "submissions": [
      {
        "_id": "phase1_submission_id",
        "studentId": {
          "_id": "student_id",
          "firstName": "Jane",
          "lastName": "Smith",
          "registerNumber": "REG002"
        },
        "eventId": {
          "_id": "event_id",
          "title": "Innovation Hackathon"
        },
        "participationType": "TEAM",
        "approvalStatus": "PENDING",
        "createdAt": "2025-01-16T14:20:00Z",
        "approvedBy": "class_advisor_id",
        "approvalComments": "Good submission"
      }
    ]
  }
}
```

**Implementation Notes:**
- Fetch Phase I submissions assigned to this coordinator
- Include student details
- Include event details
- Include participationType (INDIVIDUAL/TEAM)
- Include approvalStatus
- Include classAdvisor approval comments if available
- Sort by createdAt descending

---

### 2.3 Get Phase II Submissions for Innovation Coordinator
**Endpoint:** `GET /approvals/innovation-coordinator-phase-ii`

**Purpose:** Fetch Phase II submissions for verification

**Request:**
```javascript
GET /approvals/innovation-coordinator-phase-ii
Headers: { Authorization: "Bearer <token>" }
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "submissions": [
      {
        "_id": "phase2_submission_id",
        "studentId": {
          "_id": "student_id",
          "firstName": "Alice",
          "lastName": "Johnson",
          "registerNumber": "REG003"
        },
        "phaseISubmissionId": {
          "_id": "phase1_id",
          "eventId": {
            "_id": "event_id",
            "title": "Coding Competition"
          }
        },
        "result": "WINNER",
        "prizeAmount": 5000,
        "approvalStatus": "PENDING",
        "createdAt": "2025-01-17T11:45:00Z"
      }
    ]
  }
}
```

**Implementation Notes:**
- Fetch Phase II submissions related to Phase I submissions assigned to this coordinator
- Include student details
- Include related event info (through Phase I submission)
- Include result (PARTICIPATED, WINNER, RUNNER_UP, FINALIST, PARTICIPATION_CERTIFICATE)
- Include prizeAmount
- Include approvalStatus
- Include submission date
- Sort by createdAt descending

---

### 2.4 Approve Phase I Submission
**Endpoint:** `POST /approvals/approve-phase-i`

**Purpose:** Innovation Coordinator approves Phase I submission

**Request:**
```javascript
POST /approvals/approve-phase-i
Headers: { 
  Authorization: "Bearer <token>",
  Content-Type: "application/json" 
}
Body: {
  "submissionId": "phase1_submission_id",
  "status": "APPROVED", // or "REJECTED"
  "comments": "All details verified and approved",
  "role": "INNOVATION_COORDINATOR"
}
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Phase I submission approved successfully",
  "data": {
    "submissionId": "phase1_submission_id",
    "finalStatus": "APPROVED",
    "approvedBy": "innovation_coordinator_id",
    "approvalDate": "2025-01-17T15:30:00Z"
  }
}
```

**Implementation Notes:**
- Verify submission is assigned to current coordinator
- Update Phase I submission final approval status
- Store final approval by coordinator and date
- Create notification for student
- If APPROVED, unlock Phase II submission ability
- If REJECTED, notify student with comments

---

### 2.5 Approve Phase II Submission
**Endpoint:** `POST /approvals/approve-phase-ii`

**Purpose:** Innovation Coordinator verifies/approves Phase II submission

**Request:**
```javascript
POST /approvals/approve-phase-ii
Headers: { 
  Authorization: "Bearer <token>",
  Content-Type: "application/json" 
}
Body: {
  "submissionId": "phase2_submission_id",
  "status": "APPROVED", // or "REJECTED"
  "comments": "Prize and certificate verified",
  "role": "INNOVATION_COORDINATOR"
}
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "message": "Phase II submission verified successfully",
  "data": {
    "submissionId": "phase2_submission_id",
    "verificationStatus": "APPROVED",
    "verifiedBy": "innovation_coordinator_id",
    "verificationDate": "2025-01-17T16:45:00Z"
  }
}
```

**Implementation Notes:**
- Verify Phase II submission is related to an approved Phase I
- Update approval status
- Store verification by coordinator and date
- Create notification for student
- If approved, update student's event records and awards
- If rejected, notify student with reason

---

## 3. Faculty/Mentor Endpoints

### 3.1 Get Faculty List
**Endpoint:** `GET /faculty`

**Purpose:** Fetch list of Innovation Coordinators for assignment dropdown

**Request:**
```javascript
GET /faculty
Headers: { Authorization: "Bearer <token>" }
```

**Expected Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "faculty": [
      {
        "_id": "faculty_id_1",
        "firstName": "Dr.",
        "lastName": "Sharma",
        "email": "sharma@college.edu",
        "role": "INNOVATION_COORDINATOR"
      },
      {
        "_id": "faculty_id_2",
        "firstName": "Prof.",
        "lastName": "Patel",
        "email": "patel@college.edu",
        "role": "INNOVATION_COORDINATOR"
      }
    ]
  }
}
```

**Implementation Notes:**
- Filter faculty by role = "INNOVATION_COORDINATOR" or "MENTOR"
- Include firstName, lastName, email
- Sort by lastName then firstName
- Only return active faculty members

---

## 4. Data Models

### Phase I Submission Schema (Updates)
```javascript
{
  _id: ObjectId,
  studentId: ObjectId,      // Reference to Student
  eventId: ObjectId,        // Reference to Event
  participationType: String, // INDIVIDUAL or TEAM
  teamName: String,
  teamMembers: [ObjectId],  // Array of Student references
  paymentStatus: String,    // NOT_REQUIRED, PENDING, PAID
  paymentAmount: Number,
  createdAt: Date,
  updatedAt: Date,
  
  // Class Advisor Approval
  approvedBy: ObjectId,                    // Class Advisor ID
  approvalStatus: String,                  // PENDING, APPROVED, REJECTED
  approvalComments: String,
  approvalDate: Date,
  assignedMentor: ObjectId,                // Innovation Coordinator ID
  
  // Innovation Coordinator Final Approval
  finalApprovedBy: ObjectId,               // Coordinator ID
  finalApprovalStatus: String,             // APPROVED, REJECTED
  finalApprovalComments: String,
  finalApprovalDate: Date
}
```

### Phase II Submission Schema (Updates)
```javascript
{
  _id: ObjectId,
  phaseISubmissionId: ObjectId,  // Reference to Phase I
  studentId: ObjectId,           // Reference to Student
  result: String,                // PARTICIPATED, WINNER, RUNNER_UP, etc.
  prizeWon: String,
  prizeAmount: Number,
  eventReport: String,
  learningOutcomes: String,
  feedback: String,
  certificateUrls: [String],
  photoUrls: [String],
  geoLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  hasCertificate: Boolean,
  createdAt: Date,
  updatedAt: Date,
  
  // Verification by Innovation Coordinator
  verifiedBy: ObjectId,
  approvalStatus: String,        // PENDING, APPROVED, REJECTED
  approvalComments: String,
  approvalDate: Date
}
```

---

## 5. Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "status": "error",
  "message": "Unauthorized - Invalid or missing token",
  "code": "UNAUTHORIZED"
}
```

**403 Forbidden:**
```json
{
  "status": "error",
  "message": "Forbidden - User does not have permission for this action",
  "code": "FORBIDDEN"
}
```

**404 Not Found:**
```json
{
  "status": "error",
  "message": "Submission not found",
  "code": "NOT_FOUND"
}
```

**400 Bad Request:**
```json
{
  "status": "error",
  "message": "Invalid request data",
  "errors": [
    {
      "field": "mentorId",
      "message": "Mentor ID is required"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

**500 Internal Server Error:**
```json
{
  "status": "error",
  "message": "Internal server error",
  "code": "SERVER_ERROR"
}
```

---

## 6. Authentication & Authorization

### Required Roles:
- **CLASS_ADVISOR** - Can access `/approvals/class-advisor-*` endpoints
- **INNOVATION_COORDINATOR** - Can access `/approvals/innovation-coordinator-*` endpoints
- **ADMIN** - Can access all endpoints

### Middleware Checks:
```javascript
// Verify JWT token
// Extract user role from token
// Check if role is authorized for endpoint
// Return 403 if unauthorized
```

---

## 7. Testing Endpoints

### Using cURL:

**Get Class Advisor Stats:**
```bash
curl -X GET http://localhost:5000/approvals/class-advisor-stats \
  -H "Authorization: Bearer <token>"
```

**Submit Class Advisor Approval:**
```bash
curl -X POST http://localhost:5000/approvals/submit-approval \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "phase1_id",
    "status": "APPROVED",
    "comments": "Good",
    "mentorId": "mentor_id",
    "role": "CLASS_ADVISOR"
  }'
```

### Using Postman:
1. Create environment variables for token and IDs
2. Set up collections for each endpoint group
3. Test with sample data
4. Verify response schemas

---

## 8. Implementation Checklist

- [ ] Create/update Phase I submission schema with approval fields
- [ ] Create/update Phase II submission schema with verification fields
- [ ] Implement GET /approvals/class-advisor-stats
- [ ] Implement GET /approvals/class-advisor-submissions
- [ ] Implement POST /approvals/submit-approval
- [ ] Implement GET /approvals/innovation-coordinator-stats
- [ ] Implement GET /approvals/innovation-coordinator-phase-i
- [ ] Implement GET /approvals/innovation-coordinator-phase-ii
- [ ] Implement POST /approvals/approve-phase-i
- [ ] Implement POST /approvals/approve-phase-ii
- [ ] Implement GET /faculty (filter by coordinator role)
- [ ] Add notification system for approvals/rejections
- [ ] Add role-based access control middleware
- [ ] Create test cases for each endpoint
- [ ] Add error handling and validation
- [ ] Document API responses with examples
- [ ] Test complete approval workflow

---

## 9. Notifications (Optional but Recommended)

When implementing approval endpoints, consider creating notifications:

**When Class Advisor Approves:**
```javascript
notificationService.create({
  userId: studentId,
  type: 'PHASE1_APPROVED',
  title: 'Your On-Duty Process has been approved!',
  message: 'Your submission has been approved and forwarded to the Innovation Coordinator',
  data: { submissionId, eventId }
});
```

**When Innovation Coordinator Approves Phase I:**
```javascript
notificationService.create({
  userId: studentId,
  type: 'PHASE1_FINAL_APPROVED',
  title: 'On-Duty Process Approved',
  message: 'You can now submit your Event Participation Proof',
  data: { submissionId }
});
```

**When Submission is Rejected:**
```javascript
notificationService.create({
  userId: studentId,
  type: 'SUBMISSION_REJECTED',
  title: 'Submission Rejected',
  message: `Your submission was rejected: ${comments}`,
  data: { submissionId }
});
```

---

**Last Updated:** 2025
**Status:** Ready for Implementation
**Estimated Backend Dev Time:** 2-3 days

