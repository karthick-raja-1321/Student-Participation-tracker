# REST API Specification
## Institution-Wide Student Participation Tracking System

---

## 1. API Overview

### 1.1 Base URL
```
Development:  http://localhost:5000/api/v1
Production:   https://api.yourdomain.com/api/v1
```

### 1.2 Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### 1.3 Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { },
  "metadata": {
    "timestamp": "2025-12-02T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Detailed error message"
  },
  "metadata": {
    "timestamp": "2025-12-02T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

### 1.4 Pagination Format

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "pageSize": 20,
    "totalRecords": 195,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

### 1.5 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Success |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Duplicate resource |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error |

---

## 2. Authentication & Authorization APIs

### 2.1 User Registration

**POST** `/auth/register`

**Description:** Register a new user account

**Access:** Public

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "role": "STUDENT",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "9876543210",
    "dateOfBirth": "2003-05-15",
    "gender": "Male"
  },
  "departmentId": "65a1234567890abcdef12345"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "65a1234567890abcdef12346",
    "email": "student@example.com",
    "role": "STUDENT"
  }
}
```

---

### 2.2 User Login

**POST** `/auth/login`

**Description:** Authenticate user and get JWT token

**Access:** Public

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "65a1234567890abcdef12346",
      "email": "student@example.com",
      "role": "STUDENT",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "9876543210"
      },
      "departmentId": "65a1234567890abcdef12345"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

---

### 2.3 Logout

**POST** `/auth/logout`

**Description:** Invalidate current session

**Access:** Protected (All roles)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 2.4 Refresh Token

**POST** `/auth/refresh-token`

**Description:** Get new JWT token

**Access:** Protected (All roles)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  }
}
```

---

### 2.5 Forgot Password

**POST** `/auth/forgot-password`

**Request Body:**
```json
{
  "email": "student@example.com"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Password reset link sent to email"
}
```

---

### 2.6 Reset Password

**POST** `/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Response:** `200 OK`

---

## 3. Department APIs

### 3.1 Create Department

**POST** `/departments`

**Access:** Super Admin only

**Request Body:**
```json
{
  "name": "Computer Science and Engineering",
  "code": "CSE",
  "description": "Department of Computer Science",
  "establishedYear": 2005,
  "contactEmail": "cse@institution.edu",
  "contactPhone": "9876543210"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Department created successfully",
  "data": {
    "id": "65a1234567890abcdef12345",
    "name": "Computer Science and Engineering",
    "code": "CSE",
    "isActive": true
  }
}
```

---

### 3.2 Get All Departments

**GET** `/departments`

**Access:** All authenticated users

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string)
- `isActive` (boolean)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "65a1234567890abcdef12345",
      "name": "Computer Science and Engineering",
      "code": "CSE",
      "hodId": "65a1234567890abcdef12347",
      "hodName": "Dr. Smith",
      "metadata": {
        "totalStudents": 450,
        "totalFaculty": 25,
        "totalEvents": 12
      },
      "isActive": true
    }
  ],
  "pagination": { }
}
```

---

### 3.3 Get Department by ID

**GET** `/departments/:id`

**Access:** All authenticated users

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "65a1234567890abcdef12345",
    "name": "Computer Science and Engineering",
    "code": "CSE",
    "description": "Department of Computer Science",
    "hodId": "65a1234567890abcdef12347",
    "hodDetails": {
      "name": "Dr. Smith",
      "email": "smith@institution.edu"
    },
    "establishedYear": 2005,
    "metadata": {
      "totalStudents": 450,
      "totalFaculty": 25,
      "totalEvents": 12
    }
  }
}
```

---

### 3.4 Update Department

**PUT** `/departments/:id`

**Access:** Super Admin, HoD (own department)

**Request Body:**
```json
{
  "name": "Updated Department Name",
  "contactEmail": "new@email.com",
  "contactPhone": "9876543211"
}
```

**Response:** `200 OK`

---

### 3.5 Assign HoD

**PATCH** `/departments/:id/assign-hod`

**Access:** Super Admin only

**Request Body:**
```json
{
  "hodId": "65a1234567890abcdef12347"
}
```

**Response:** `200 OK`

---

## 4. Student APIs

### 4.1 Create Student

**POST** `/students`

**Access:** Super Admin, HoD (own department)

**Request Body:**
```json
{
  "userId": "65a1234567890abcdef12346",
  "rollNumber": "21CSE101",
  "registerNumber": "421521104001",
  "departmentId": "65a1234567890abcdef12345",
  "academicInfo": {
    "year": 3,
    "section": "A",
    "batch": "2021-2025",
    "semester": 5,
    "cgpa": 8.5
  },
  "mentorId": "65a1234567890abcdef12348",
  "classAdvisorId": "65a1234567890abcdef12349",
  "tutorIds": ["65a1234567890abcdef1234a", "65a1234567890abcdef1234b"]
}
```

**Response:** `201 Created`

---

### 4.2 Get All Students

**GET** `/students`

**Access:** Super Admin (all), HoD (own dept), Faculty (assigned)

**Query Parameters:**
- `departmentId` (string)
- `year` (number)
- `section` (string)
- `mentorId` (string)
- `advisorId` (string)
- `page` (number)
- `limit` (number)
- `search` (string)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "65a1234567890abcdef12346",
      "rollNumber": "21CSE101",
      "registerNumber": "421521104001",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com"
      },
      "department": {
        "id": "65a1234567890abcdef12345",
        "name": "CSE",
        "code": "CSE"
      },
      "academicInfo": {
        "year": 3,
        "section": "A",
        "cgpa": 8.5
      },
      "mentor": {
        "id": "65a1234567890abcdef12348",
        "name": "Dr. Mentor"
      },
      "participationStats": {
        "totalEvents": 5,
        "phaseIICompleted": 4,
        "phaseIIPending": 1
      }
    }
  ],
  "pagination": { }
}
```

---

### 4.3 Get Student by ID

**GET** `/students/:id`

**Access:** Super Admin, HoD, Faculty (if assigned), Student (own profile)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "65a1234567890abcdef12346",
    "rollNumber": "21CSE101",
    "registerNumber": "421521104001",
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phoneNumber": "9876543210"
    },
    "department": { },
    "academicInfo": { },
    "mentor": { },
    "classAdvisor": { },
    "tutors": [],
    "participationStats": { }
  }
}
```

---

### 4.4 Update Student

**PUT** `/students/:id`

**Access:** Super Admin, HoD, Student (own profile - limited fields)

**Request Body:**
```json
{
  "academicInfo": {
    "year": 4,
    "semester": 7,
    "cgpa": 8.7
  }
}
```

**Response:** `200 OK`

---

### 4.5 Assign Mentor/Advisor

**PATCH** `/students/:id/assign-faculty`

**Access:** Super Admin, HoD

**Request Body:**
```json
{
  "mentorId": "65a1234567890abcdef12348",
  "classAdvisorId": "65a1234567890abcdef12349",
  "tutorIds": ["65a1234567890abcdef1234a", "65a1234567890abcdef1234b"]
}
```

**Response:** `200 OK`

---

## 5. Faculty APIs

### 5.1 Create Faculty

**POST** `/faculty`

**Access:** Super Admin, HoD (own department)

**Request Body:**
```json
{
  "userId": "65a1234567890abcdef12350",
  "employeeId": "EMP001",
  "departmentId": "65a1234567890abcdef12345",
  "designation": "Assistant Professor",
  "roles": ["CLASS_ADVISOR", "MENTOR"],
  "whatsappNumber": "9876543210"
}
```

**Response:** `201 Created`

---

### 5.2 Get All Faculty

**GET** `/faculty`

**Query Parameters:**
- `departmentId`
- `role` (CLASS_ADVISOR, MENTOR, TUTOR, HOD)
- `page`
- `limit`

**Response:** `200 OK`

---

### 5.3 Assign Class/Mentees

**PATCH** `/faculty/:id/assignments`

**Request Body:**
```json
{
  "assignedClasses": [
    {
      "year": 3,
      "section": "A",
      "role": "CLASS_ADVISOR"
    }
  ],
  "assignedMentees": ["studentId1", "studentId2"]
}
```

**Response:** `200 OK`

---

## 6. Event APIs

### 6.1 Create Event

**POST** `/events`

**Access:** Super Admin, HoD, Faculty

**Request Body:**
```json
{
  "title": "National Level Hackathon 2025",
  "description": "48-hour coding competition",
  "eventType": "Hackathon",
  "scope": "EXTERNAL",
  "organizer": {
    "organizerName": "Tech Corp",
    "organizerType": "External",
    "contactEmail": "contact@techcorp.com"
  },
  "venue": {
    "location": "Tech Park, Bangalore",
    "city": "Bangalore",
    "state": "Karnataka",
    "isOnline": false
  },
  "dates": {
    "startDate": "2025-03-15T09:00:00Z",
    "endDate": "2025-03-17T18:00:00Z",
    "registrationDeadline": "2025-03-10T23:59:59Z"
  },
  "eligibility": {
    "departments": [],
    "years": [2, 3, 4],
    "minCGPA": 7.0,
    "maxParticipants": 100
  },
  "fees": {
    "amount": 500,
    "paymentRequired": true
  },
  "prizes": {
    "hasPrizes": true,
    "prizeDetails": "1st: 50k, 2nd: 30k, 3rd: 20k",
    "totalPrizePool": 100000
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "65a1234567890abcdef12360",
    "title": "National Level Hackathon 2025",
    "scope": "EXTERNAL",
    "status": "DRAFT"
  }
}
```

---

### 6.2 Get All Events

**GET** `/events`

**Access:** All authenticated users

**Query Parameters:**
- `scope` (DEPARTMENT, INSTITUTION, EXTERNAL)
- `status` (DRAFT, PUBLISHED, ONGOING, COMPLETED)
- `departmentId`
- `startDate` (filter from date)
- `endDate` (filter to date)
- `eventType`
- `search`
- `page`
- `limit`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "65a1234567890abcdef12360",
      "title": "National Level Hackathon 2025",
      "description": "48-hour coding competition",
      "eventType": "Hackathon",
      "scope": "EXTERNAL",
      "venue": {
        "location": "Tech Park, Bangalore",
        "city": "Bangalore"
      },
      "dates": {
        "startDate": "2025-03-15T09:00:00Z",
        "endDate": "2025-03-17T18:00:00Z"
      },
      "status": "PUBLISHED",
      "analytics": {
        "totalViews": 150,
        "totalRegistrations": 45
      }
    }
  ],
  "pagination": { }
}
```

---

### 6.3 Get Event by ID

**GET** `/events/:id`

**Access:** All authenticated users

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "65a1234567890abcdef12360",
    "title": "National Level Hackathon 2025",
    "description": "...",
    "eventType": "Hackathon",
    "scope": "EXTERNAL",
    "organizer": { },
    "venue": { },
    "dates": { },
    "eligibility": { },
    "fees": { },
    "prizes": { },
    "poster": {
      "url": "https://s3.amazonaws.com/poster.jpg"
    },
    "createdBy": {
      "userId": "65a1234567890abcdef12350",
      "userRole": "FACULTY"
    },
    "status": "PUBLISHED",
    "analytics": {
      "totalViews": 150,
      "totalRegistrations": 45,
      "departmentWiseStats": []
    }
  }
}
```

---

### 6.4 Update Event

**PUT** `/events/:id`

**Access:** Super Admin, Creator (own event)

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response:** `200 OK`

---

### 6.5 Delete Event

**DELETE** `/events/:id`

**Access:** Super Admin, Creator (own event)

**Response:** `200 OK`

---

### 6.6 Publish Event

**PATCH** `/events/:id/publish`

**Access:** Super Admin, HoD, Creator

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Event published successfully",
  "data": {
    "id": "65a1234567890abcdef12360",
    "status": "PUBLISHED"
  }
}
```

---

### 6.7 Track Event View

**POST** `/events/:id/track-view`

**Access:** All authenticated users

**Response:** `200 OK`

---

## 7. Event Registration APIs

### 7.1 Register for Event

**POST** `/events/:eventId/register`

**Access:** Student

**Request Body:**
```json
{
  "registrationType": "TEAM",
  "teamDetails": {
    "teamName": "Code Warriors",
    "teamMembers": [
      {
        "studentId": "65a1234567890abcdef12346",
        "name": "John Doe",
        "rollNumber": "21CSE101",
        "role": "Leader"
      },
      {
        "studentId": "65a1234567890abcdef12347",
        "name": "Jane Smith",
        "rollNumber": "21CSE102",
        "role": "Member"
      }
    ]
  },
  "paymentDetails": {
    "amount": 500,
    "transactionId": "TXN123456",
    "paymentMode": "UPI"
  }
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Registered successfully",
  "data": {
    "registrationId": "65a1234567890abcdef12370",
    "eventId": "65a1234567890abcdef12360",
    "registrationStatus": "CONFIRMED"
  }
}
```

---

### 7.2 Get My Registrations

**GET** `/registrations/my-registrations`

**Access:** Student

**Response:** `200 OK`

---

### 7.3 Cancel Registration

**DELETE** `/registrations/:id`

**Access:** Student (own registration)

**Request Body:**
```json
{
  "cancellationReason": "Unable to attend due to exams"
}
```

**Response:** `200 OK`

---

## 8. Phase I Submission APIs

### 8.1 Create Phase I Submission

**POST** `/submissions/phase-i`

**Access:** Student

**Request Body (multipart/form-data):**
```
eventId: "65a1234567890abcdef12360"
eventDetails: {
  "eventName": "National Hackathon",
  "eventVenue": "Bangalore",
  "eventOrganizer": "Tech Corp",
  "eventStartDate": "2025-03-15",
  "eventEndDate": "2025-03-17"
}
participantDetails: {
  "participationType": "INDIVIDUAL"
}
facultyDetails: {
  "mentorId": "65a1234567890abcdef12348",
  "classAdvisorId": "65a1234567890abcdef12349"
}
selectionProof: File (PDF)
paymentProof: File (PDF, optional)
odRequestForm: File (PDF)
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Phase I submitted successfully",
  "data": {
    "submissionId": "65a1234567890abcdef12380",
    "submissionStatus": "SUBMITTED",
    "submittedAt": "2025-03-01T10:00:00Z"
  }
}
```

---

### 8.2 Get Phase I Submissions

**GET** `/submissions/phase-i`

**Access:** Super Admin (all), HoD (dept), Faculty (assigned), Student (own)

**Query Parameters:**
- `studentId`
- `eventId`
- `departmentId`
- `status` (DRAFT, SUBMITTED, APPROVED, REJECTED)
- `mentorId`
- `advisorId`
- `page`
- `limit`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "65a1234567890abcdef12380",
      "eventId": "65a1234567890abcdef12360",
      "eventName": "National Hackathon",
      "student": {
        "id": "65a1234567890abcdef12346",
        "name": "John Doe",
        "rollNumber": "21CSE101"
      },
      "submissionStatus": "SUBMITTED",
      "documents": {
        "selectionProof": {
          "url": "https://s3.../proof.pdf"
        },
        "odRequestForm": {
          "url": "https://s3.../od.pdf"
        }
      },
      "submittedAt": "2025-03-01T10:00:00Z"
    }
  ],
  "pagination": { }
}
```

---

### 8.3 Get Phase I by ID

**GET** `/submissions/phase-i/:id`

**Response:** `200 OK`

---

### 8.4 Update Phase I (Draft only)

**PUT** `/submissions/phase-i/:id`

**Access:** Student (if status is DRAFT)

**Response:** `200 OK`

---

## 9. Phase II Submission APIs

### 9.1 Create Phase II Submission

**POST** `/submissions/phase-ii`

**Access:** Student

**Request Body (multipart/form-data):**
```
phaseISubmissionId: "65a1234567890abcdef12380"
geoTaggedPhoto: File (JPG/PNG with EXIF data)
participationDocument: File (PDF)
prizeDetails: {
  "wonPrize": true,
  "prizePosition": "First",
  "prizeName": "Winner",
  "prizeAmount": 50000
}
certificates: [File1, File2] (PDFs)
eventReport: {
  "reportText": "Detailed event report...",
  "keyLearnings": ["Learning 1", "Learning 2"]
}
reportDocument: File (PDF, optional)
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Phase II submitted successfully",
  "data": {
    "submissionId": "65a1234567890abcdef12390",
    "phaseISubmissionId": "65a1234567890abcdef12380",
    "submissionStatus": "SUBMITTED",
    "submittedAt": "2025-03-20T15:30:00Z",
    "daysPendingSincePhaseI": 5
  }
}
```

---

### 9.2 Get Phase II Submissions

**GET** `/submissions/phase-ii`

**Query Parameters:** (same as Phase I)

**Response:** `200 OK`

---

### 9.3 Get Overdue Phase II Submissions

**GET** `/submissions/phase-ii/overdue`

**Access:** Super Admin, HoD, Faculty

**Query Parameters:**
- `departmentId`
- `mentorId`
- `advisorId`
- `minDaysPending` (default: 14)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "phaseISubmissionId": "65a1234567890abcdef12380",
      "student": {
        "id": "65a1234567890abcdef12346",
        "name": "John Doe",
        "rollNumber": "21CSE101"
      },
      "event": {
        "id": "65a1234567890abcdef12360",
        "name": "National Hackathon"
      },
      "phaseIApprovedAt": "2025-03-05T10:00:00Z",
      "daysPending": 18,
      "isOverdue": true,
      "remindersSent": 2,
      "lastReminderSentAt": "2025-03-21T09:00:00Z",
      "mentor": {
        "name": "Dr. Mentor",
        "whatsappNumber": "9876543210"
      },
      "classAdvisor": {
        "name": "Dr. Advisor",
        "whatsappNumber": "9876543211"
      }
    }
  ]
}
```

---

## 10. Approval APIs

### 10.1 Get Approval Queue

**GET** `/approvals/queue`

**Access:** Super Admin, HoD, Faculty (mentors/advisors)

**Query Parameters:**
- `approverRole` (MENTOR, CLASS_ADVISOR, HOD, SUPER_ADMIN)
- `approverId`
- `approvalStatus` (PENDING, APPROVED, REJECTED)
- `submissionType` (PHASE_I, PHASE_II)
- `page`
- `limit`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "65a1234567890abcdef123a0",
      "submissionId": "65a1234567890abcdef12380",
      "submissionType": "PHASE_I",
      "student": {
        "name": "John Doe",
        "rollNumber": "21CSE101"
      },
      "event": {
        "name": "National Hackathon"
      },
      "approverRole": "MENTOR",
      "approvalStatus": "PENDING",
      "requestedAt": "2025-03-01T10:00:00Z"
    }
  ],
  "pagination": { }
}
```

---

### 10.2 Approve Submission

**PATCH** `/approvals/:id/approve`

**Access:** Authorized approvers based on role

**Request Body:**
```json
{
  "comments": "Approved. Good participation proof."
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Submission approved successfully",
  "data": {
    "approvalId": "65a1234567890abcdef123a0",
    "approvalStatus": "APPROVED",
    "approvedAt": "2025-03-02T11:00:00Z"
  }
}
```

---

### 10.3 Reject Submission

**PATCH** `/approvals/:id/reject`

**Request Body:**
```json
{
  "comments": "Selection proof is not clear. Please resubmit."
}
```

**Response:** `200 OK`

---

### 10.4 Request Revision

**PATCH** `/approvals/:id/request-revision`

**Request Body:**
```json
{
  "revisionNotes": "Please update the following:\n1. Clear OD form\n2. Event dates correction"
}
```

**Response:** `200 OK`

---

## 11. Excel Import/Export APIs

### 11.1 Download Template

**GET** `/excel/templates/:type`

**Access:** Super Admin, HoD

**Path Parameters:**
- `type` (students, faculty, departments, class-mapping, mentor-mapping, master)

**Response:** `200 OK` (File Download)
- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Content-Disposition: `attachment; filename="students_template.xlsx"`

---

### 11.2 Upload Excel Data

**POST** `/excel/import`

**Access:** Super Admin, HoD (own department)

**Request Body (multipart/form-data):**
```
importType: "STUDENTS"
departmentId: "65a1234567890abcdef12345" (optional, for HoD)
file: Excel File
```

**Response:** `202 Accepted` (Processing)
```json
{
  "success": true,
  "message": "Import started. Processing in background.",
  "data": {
    "importLogId": "65a1234567890abcdef123b0",
    "importType": "STUDENTS",
    "fileName": "students_batch_2025.xlsx",
    "processingStatus": "PROCESSING"
  }
}
```

---

### 11.3 Get Import Status

**GET** `/excel/import/:importLogId`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "65a1234567890abcdef123b0",
    "importType": "STUDENTS",
    "fileName": "students_batch_2025.xlsx",
    "processingStatus": "COMPLETED",
    "statistics": {
      "totalRows": 100,
      "successfulRows": 95,
      "failedRows": 5,
      "duplicateRows": 2
    },
    "errors": [
      {
        "rowNumber": 10,
        "columnName": "email",
        "errorMessage": "Invalid email format"
      }
    ],
    "errorReportUrl": "https://s3.../error_report.xlsx",
    "processingDuration": 45
  }
}
```

---

### 11.4 Get Import Logs

**GET** `/excel/import-logs`

**Query Parameters:**
- `importType`
- `departmentId`
- `processingStatus`
- `page`
- `limit`

**Response:** `200 OK`

---

### 11.5 Download Error Report

**GET** `/excel/import/:importLogId/error-report`

**Response:** `200 OK` (File Download)

---

## 12. Reports & Analytics APIs

### 12.1 Get Dashboard Statistics

**GET** `/reports/dashboard`

**Access:** All authenticated users (scope based on role)

**Query Parameters:**
- `departmentId` (optional for Super Admin)
- `startDate`
- `endDate`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalStudents": 450,
      "totalEvents": 25,
      "totalParticipations": 120,
      "phaseIIPending": 15,
      "phaseIIOverdue": 5
    },
    "eventStats": {
      "upcoming": 3,
      "ongoing": 2,
      "completed": 20
    },
    "participationTrends": [
      {
        "month": "2025-01",
        "participations": 15
      },
      {
        "month": "2025-02",
        "participations": 22
      }
    ],
    "topPerformers": [
      {
        "studentId": "65a1234567890abcdef12346",
        "name": "John Doe",
        "totalEvents": 8,
        "prizesWon": 3
      }
    ]
  }
}
```

---

### 12.2 Department-wise Report

**GET** `/reports/department-wise`

**Access:** Super Admin

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "department": {
        "id": "65a1234567890abcdef12345",
        "name": "CSE",
        "code": "CSE"
      },
      "statistics": {
        "totalStudents": 450,
        "participatingStudents": 120,
        "participationRate": "26.67%",
        "totalEvents": 15,
        "phaseISubmissions": 120,
        "phaseIICompleted": 100,
        "phaseIIPending": 15,
        "phaseIIOverdue": 5,
        "totalPrizesWon": 25,
        "totalPrizeAmount": 150000
      }
    }
  ]
}
```

---

### 12.3 Year-wise Report

**GET** `/reports/year-wise`

**Query Parameters:**
- `departmentId`
- `year` (1, 2, 3, 4)

**Response:** `200 OK`

---

### 12.4 Section-wise Report

**GET** `/reports/section-wise`

**Query Parameters:**
- `departmentId`
- `year`
- `section` (A, B, C, D)

**Response:** `200 OK`

---

### 12.5 Faculty-wise Report

**GET** `/reports/faculty-wise`

**Query Parameters:**
- `departmentId`
- `facultyId`
- `role` (CLASS_ADVISOR, MENTOR, TUTOR)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "faculty": {
      "id": "65a1234567890abcdef12348",
      "name": "Dr. Mentor",
      "employeeId": "EMP001"
    },
    "roles": ["CLASS_ADVISOR", "MENTOR"],
    "statistics": {
      "totalStudents": 30,
      "participatingStudents": 18,
      "phaseISubmissions": 18,
      "phaseIICompleted": 15,
      "phaseIIPending": 2,
      "phaseIIOverdue": 1
    },
    "students": [
      {
        "studentId": "65a1234567890abcdef12346",
        "name": "John Doe",
        "rollNumber": "21CSE101",
        "totalEvents": 5,
        "completedSubmissions": 4,
        "pendingSubmissions": 1
      }
    ]
  }
}
```

---

### 12.6 Event-wise Report

**GET** `/reports/event-wise`

**Query Parameters:**
- `eventId`
- `departmentId`
- `startDate`
- `endDate`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "event": {
      "id": "65a1234567890abcdef12360",
      "name": "National Hackathon",
      "eventType": "Hackathon"
    },
    "statistics": {
      "totalViews": 200,
      "totalRegistrations": 50,
      "phaseISubmissions": 45,
      "phaseIISubmissions": 40,
      "completionRate": "88.89%",
      "prizesWon": 5
    },
    "departmentWise": [
      {
        "department": "CSE",
        "registrations": 25,
        "participations": 22
      }
    ]
  }
}
```

---

### 12.7 Student Participation Report

**GET** `/reports/student/:studentId`

**Access:** Super Admin, HoD, Faculty (assigned), Student (own)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "student": {
      "id": "65a1234567890abcdef12346",
      "name": "John Doe",
      "rollNumber": "21CSE101",
      "department": "CSE",
      "year": 3,
      "section": "A"
    },
    "summary": {
      "totalEventsRegistered": 8,
      "phaseISubmitted": 8,
      "phaseIICompleted": 7,
      "phaseIIPending": 1,
      "phaseIIOverdue": 0,
      "prizesWon": 3,
      "totalPrizeAmount": 35000
    },
    "participations": [
      {
        "eventId": "65a1234567890abcdef12360",
        "eventName": "National Hackathon",
        "eventDate": "2025-03-15",
        "phaseIStatus": "APPROVED",
        "phaseIIStatus": "COMPLETED",
        "prizeWon": "First Prize",
        "prizeAmount": 50000
      }
    ]
  }
}
```

---

### 12.8 Export Report

**POST** `/reports/export`

**Request Body:**
```json
{
  "reportType": "DEPARTMENT_WISE",
  "format": "EXCEL",
  "filters": {
    "departmentId": "65a1234567890abcdef12345",
    "startDate": "2025-01-01",
    "endDate": "2025-12-31"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "downloadUrl": "https://s3.../report_20250302.xlsx",
    "expiresAt": "2025-03-09T10:00:00Z"
  }
}
```

---

## 13. Notification APIs

### 13.1 Get Notifications

**GET** `/notifications`

**Access:** All authenticated users

**Query Parameters:**
- `isRead` (boolean)
- `notificationType`
- `priority`
- `page`
- `limit`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "65a1234567890abcdef123c0",
      "notificationType": "SUBMISSION_APPROVED",
      "title": "Phase I Approved",
      "message": "Your Phase I submission for National Hackathon has been approved.",
      "priority": "HIGH",
      "status": {
        "isRead": false
      },
      "actionUrl": "/submissions/phase-i/65a1234567890abcdef12380",
      "createdAt": "2025-03-02T11:00:00Z"
    }
  ],
  "pagination": { },
  "unreadCount": 5
}
```

---

### 13.2 Mark as Read

**PATCH** `/notifications/:id/read`

**Response:** `200 OK`

---

### 13.3 Mark All as Read

**PATCH** `/notifications/read-all`

**Response:** `200 OK`

---

### 13.4 Get Unread Count

**GET** `/notifications/unread-count`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "unreadCount": 5
  }
}
```

---

## 14. WhatsApp Log APIs

### 14.1 Get WhatsApp Logs

**GET** `/whatsapp-logs`

**Access:** Super Admin, HoD (own dept), Faculty (assigned students)

**Query Parameters:**
- `recipientId`
- `messageType`
- `deliveryStatus`
- `startDate`
- `endDate`
- `page`
- `limit`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "65a1234567890abcdef123d0",
      "recipientId": "65a1234567890abcdef12348",
      "recipientName": "Dr. Mentor",
      "recipientPhone": "+919876543210",
      "messageType": "PHASE_II_REMINDER",
      "messageContent": "🔔 Reminder: Phase II Pending...",
      "relatedSubmission": {
        "studentName": "John Doe",
        "eventName": "National Hackathon",
        "daysPending": 16
      },
      "deliveryStatus": "DELIVERED",
      "sentAt": "2025-03-21T09:00:00Z",
      "deliveredAt": "2025-03-21T09:00:15Z"
    }
  ],
  "pagination": { }
}
```

---

### 14.2 Send Manual Reminder

**POST** `/whatsapp-logs/send-reminder`

**Access:** Super Admin, HoD

**Request Body:**
```json
{
  "submissionId": "65a1234567890abcdef12380",
  "recipients": ["mentorId", "advisorId"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Reminders sent successfully",
  "data": {
    "sent": 2,
    "failed": 0
  }
}
```

---

## 15. File Upload APIs

### 15.1 Upload File

**POST** `/files/upload`

**Access:** All authenticated users

**Request Body (multipart/form-data):**
```
file: File
category: "od-form" | "selection-proof" | "payment-proof" | "certificate" | "geo-tagged-photo"
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "url": "https://s3.amazonaws.com/bucket/file.pdf",
    "filename": "od-form_123456.pdf",
    "fileSize": 245678,
    "mimeType": "application/pdf"
  }
}
```

---

### 15.2 Delete File

**DELETE** `/files/:fileId`

**Access:** File owner or Admin

**Response:** `200 OK`

---

## Document Information

- **Version:** 1.0
- **Last Updated:** December 2, 2025
- **Total Endpoints:** 60+
- **Authentication:** JWT Bearer Token
- **Status:** Production-ready

