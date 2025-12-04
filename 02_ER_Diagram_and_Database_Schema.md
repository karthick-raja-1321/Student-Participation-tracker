# ER Diagram and Database Schema
## Institution-Wide Student Participation Tracking System

---

## 1. Entity-Relationship Diagram (ERD)

### 1.1 High-Level ER Diagram

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│  DEPARTMENT  │────────>│   FACULTY    │<────────│   STUDENT    │
│              │  1:N    │              │  N:M    │              │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                         │
       │                        │                         │
       │ 1:N                    │ 1:N                     │ 1:N
       │                        │                         │
       ▼                        ▼                         ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│    EVENT     │────────>│EVENT_VIEWS   │         │PHASE_I_SUB   │
│              │  1:N    │              │         │              │
└──────────────┘         └──────────────┘         └──────────────┘
       │                                                  │
       │ 1:N                                              │ 1:1
       │                                                  │
       ▼                                                  ▼
┌──────────────┐                                  ┌──────────────┐
│              │                                  │              │
│EVENT_REGISTER│                                  │PHASE_II_SUB  │
│              │                                  │              │
└──────────────┘                                  └──────────────┘
       │                                                  │
       │                                                  │
       │ 1:N                                              │ 1:N
       │                                                  │
       ▼                                                  ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│              │         │              │         │              │
│SUBMISSION_LOG│────────>│  APPROVAL    │<────────│ NOTIFICATION │
│              │  1:N    │              │  1:N    │              │
└──────────────┘         └──────────────┘         └──────────────┘
                                │
                                │ 1:N
                                │
                                ▼
                         ┌──────────────┐
                         │              │
                         │WHATSAPP_LOG  │
                         │              │
                         └──────────────┘
```

### 1.2 Detailed Relationships

| Entity A | Relationship | Entity B | Cardinality | Description |
|----------|-------------|----------|-------------|-------------|
| Department | has | Faculty | 1:N | Each department has multiple faculty |
| Department | has | Student | 1:N | Each department has multiple students |
| Department | creates | Event | 1:N | Each department can create multiple events |
| Faculty | mentors | Student | M:N | Faculty can mentor multiple students |
| Faculty | advises | Student | 1:N | One advisor per class section |
| Faculty | tutors | Student | M:N | Multiple tutors per section |
| Student | submits | PhaseISubmission | 1:N | Student can submit multiple Phase I |
| PhaseISubmission | has | PhaseIISubmission | 1:1 | Each Phase I has one Phase II |
| Student | registers | Event | M:N | Students register for events |
| Event | has | EventView | 1:N | Track event views |
| Submission | has | Approval | 1:N | Multiple approvals per submission |
| Submission | generates | Notification | 1:N | Notifications for stakeholders |
| Submission | triggers | WhatsAppLog | 1:N | WhatsApp reminders |
| User | uploads | ExcelImportLog | 1:N | Track Excel imports |

---

## 2. MongoDB Schema Design

### 2.1 Users Collection

```javascript
{
  collection: "users",
  schema: {
    _id: ObjectId,
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'HOD', 'FACULTY', 'STUDENT'],
      required: true
    },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      phoneNumber: { 
        type: String, 
        required: true,
        match: /^[6-9]\d{9}$/  // Indian mobile format
      },
      profilePicture: String,
      dateOfBirth: Date,
      gender: {
        type: String,
        enum: ['Male', 'Female', 'Other']
      }
    },
    departmentId: {
      type: ObjectId,
      ref: 'Department',
      required: function() { return this.role !== 'SUPER_ADMIN'; }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  indexes: [
    { email: 1 },
    { role: 1 },
    { departmentId: 1 },
    { 'profile.phoneNumber': 1 }
  ]
}
```

### 2.2 Departments Collection

```javascript
{
  collection: "departments",
  schema: {
    _id: ObjectId,
    name: {
      type: String,
      required: true,
      unique: true,
      // e.g., "Computer Science and Engineering"
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      // e.g., "CSE", "ECE", "IT", "MECH", "CIVIL", "AI-DS"
    },
    hodId: {
      type: ObjectId,
      ref: 'Faculty',
      required: false  // Can be assigned later
    },
    innovationCoordinatorId: {
      type: ObjectId,
      ref: 'User',
      required: false  // Super admin role
    },
    description: String,
    establishedYear: Number,
    contactEmail: String,
    contactPhone: String,
    isActive: {
      type: Boolean,
      default: true
    },
    metadata: {
      totalStudents: { type: Number, default: 0 },
      totalFaculty: { type: Number, default: 0 },
      totalEvents: { type: Number, default: 0 }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  indexes: [
    { code: 1 },
    { name: 1 },
    { hodId: 1 }
  ]
}
```

### 2.3 Students Collection

```javascript
{
  collection: "students",
  schema: {
    _id: ObjectId,
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    registerNumber: {
      type: String,
      required: true,
      unique: true
    },
    departmentId: {
      type: ObjectId,
      ref: 'Department',
      required: true
    },
    academicInfo: {
      year: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4],  // I, II, III, IV year
        min: 1,
        max: 4
      },
      section: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D'],
        uppercase: true
      },
      batch: {
        type: String,
        required: true,
        // e.g., "2022-2026"
      },
      semester: {
        type: Number,
        min: 1,
        max: 8
      },
      cgpa: {
        type: Number,
        min: 0,
        max: 10
      }
    },
    mentorId: {
      type: ObjectId,
      ref: 'Faculty',
      required: false
    },
    classAdvisorId: {
      type: ObjectId,
      ref: 'Faculty',
      required: false
    },
    tutorIds: [{
      type: ObjectId,
      ref: 'Faculty'
    }],  // Each section has 1 advisor + 2 tutors
    parentInfo: {
      fatherName: String,
      motherName: String,
      guardianName: String,
      contactNumber: String,
      email: String
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    participationStats: {
      totalEvents: { type: Number, default: 0 },
      phaseISubmitted: { type: Number, default: 0 },
      phaseIICompleted: { type: Number, default: 0 },
      phaseIIPending: { type: Number, default: 0 },
      prizesWon: { type: Number, default: 0 },
      totalPrizeAmount: { type: Number, default: 0 }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  indexes: [
    { userId: 1 },
    { rollNumber: 1 },
    { registerNumber: 1 },
    { departmentId: 1, 'academicInfo.year': 1, 'academicInfo.section': 1 },
    { mentorId: 1 },
    { classAdvisorId: 1 },
    { tutorIds: 1 }
  ]
}
```

### 2.4 Faculty Collection

```javascript
{
  collection: "faculty",
  schema: {
    _id: ObjectId,
    userId: {
      type: ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    departmentId: {
      type: ObjectId,
      ref: 'Department',
      required: true
    },
    designation: {
      type: String,
      required: true,
      enum: [
        'Professor',
        'Associate Professor',
        'Assistant Professor',
        'Lecturer',
        'HOD'
      ]
    },
    roles: [{
      type: String,
      enum: ['CLASS_ADVISOR', 'MENTOR', 'TUTOR', 'HOD'],
      // Faculty can have multiple roles
    }],
    assignedClasses: [{
      year: {
        type: Number,
        enum: [1, 2, 3, 4]
      },
      section: {
        type: String,
        enum: ['A', 'B', 'C', 'D']
      },
      role: {
        type: String,
        enum: ['CLASS_ADVISOR', 'TUTOR']
      }
    }],
    assignedMentees: [{
      type: ObjectId,
      ref: 'Student'
    }],
    qualifications: {
      highestDegree: {
        type: String,
        enum: ['B.E', 'B.Tech', 'M.E', 'M.Tech', 'Ph.D']
      },
      specialization: String,
      university: String,
      yearOfCompletion: Number
    },
    experience: {
      totalYears: Number,
      industryYears: Number,
      teachingYears: Number
    },
    areasOfInterest: [String],
    publications: Number,
    patents: Number,
    whatsappNumber: {
      type: String,
      required: true,
      match: /^[6-9]\d{9}$/
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  indexes: [
    { userId: 1 },
    { employeeId: 1 },
    { departmentId: 1 },
    { 'assignedClasses.year': 1, 'assignedClasses.section': 1 },
    { assignedMentees: 1 }
  ]
}
```

### 2.5 Events Collection

```javascript
{
  collection: "events",
  schema: {
    _id: ObjectId,
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'Technical Workshop',
        'Hackathon',
        'Conference',
        'Seminar',
        'Competition',
        'Cultural Event',
        'Sports Event',
        'Industrial Visit',
        'Guest Lecture',
        'Project Exhibition',
        'Other'
      ]
    },
    scope: {
      type: String,
      required: true,
      enum: ['DEPARTMENT', 'INSTITUTION', 'EXTERNAL'],
      // DEPARTMENT: Only for specific department
      // INSTITUTION: All departments can participate
      // EXTERNAL: External events
    },
    organizer: {
      organizerName: {
        type: String,
        required: true
      },
      organizerType: {
        type: String,
        enum: ['Internal', 'External', 'Joint'],
        required: true
      },
      contactPerson: String,
      contactEmail: String,
      contactPhone: String
    },
    venue: {
      location: {
        type: String,
        required: true
      },
      address: String,
      city: String,
      state: String,
      country: String,
      isOnline: {
        type: Boolean,
        default: false
      },
      meetingLink: String
    },
    dates: {
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      registrationDeadline: Date,
      registrationStartDate: Date
    },
    eligibility: {
      departments: [{
        type: ObjectId,
        ref: 'Department'
      }],  // Empty means all departments
      years: [{
        type: Number,
        enum: [1, 2, 3, 4]
      }],  // Empty means all years
      minCGPA: Number,
      maxParticipants: Number
    },
    fees: {
      amount: {
        type: Number,
        default: 0
      },
      currency: {
        type: String,
        default: 'INR'
      },
      paymentRequired: {
        type: Boolean,
        default: false
      }
    },
    prizes: {
      hasPrizes: {
        type: Boolean,
        default: false
      },
      prizeDetails: String,
      totalPrizePool: Number
    },
    createdBy: {
      userId: {
        type: ObjectId,
        ref: 'User',
        required: true
      },
      userRole: {
        type: String,
        enum: ['FACULTY', 'STUDENT', 'SUPER_ADMIN']
      }
    },
    departmentId: {
      type: ObjectId,
      ref: 'Department',
      // Required only if scope is DEPARTMENT
    },
    poster: {
      url: String,
      filename: String
    },
    attachments: [{
      url: String,
      filename: String,
      fileType: String
    }],
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
      default: 'DRAFT'
    },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE'],
      default: 'PUBLIC'
    },
    analytics: {
      totalViews: { type: Number, default: 0 },
      totalRegistrations: { type: Number, default: 0 },
      totalParticipations: { type: Number, default: 0 },
      departmentWiseStats: [{
        departmentId: ObjectId,
        views: Number,
        registrations: Number,
        participations: Number
      }]
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  indexes: [
    { title: 'text', description: 'text' },
    { scope: 1 },
    { departmentId: 1 },
    { 'dates.startDate': 1 },
    { status: 1 },
    { createdBy: 1 }
  ]
}
```

### 2.6 EventViews Collection

```javascript
{
  collection: "event_views",
  schema: {
    _id: ObjectId,
    eventId: {
      type: ObjectId,
      ref: 'Event',
      required: true
    },
    viewedBy: {
      userId: {
        type: ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['STUDENT', 'FACULTY', 'HOD', 'SUPER_ADMIN']
      }
    },
    departmentId: {
      type: ObjectId,
      ref: 'Department'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String,
    userAgent: String
  },
  indexes: [
    { eventId: 1, 'viewedBy.userId': 1 },
    { eventId: 1, departmentId: 1 },
    { viewedAt: -1 }
  ]
}
```

### 2.7 EventRegistrations Collection

```javascript
{
  collection: "event_registrations",
  schema: {
    _id: ObjectId,
    eventId: {
      type: ObjectId,
      ref: 'Event',
      required: true
    },
    studentId: {
      type: ObjectId,
      ref: 'Student',
      required: true
    },
    departmentId: {
      type: ObjectId,
      ref: 'Department',
      required: true
    },
    registrationType: {
      type: String,
      enum: ['INDIVIDUAL', 'TEAM'],
      default: 'INDIVIDUAL'
    },
    teamDetails: {
      teamName: String,
      teamMembers: [{
        studentId: {
          type: ObjectId,
          ref: 'Student'
        },
        name: String,
        rollNumber: String,
        role: String  // Leader, Member
      }]
    },
    registrationStatus: {
      type: String,
      enum: ['REGISTERED', 'CONFIRMED', 'CANCELLED', 'WAITLISTED'],
      default: 'REGISTERED'
    },
    paymentStatus: {
      type: String,
      enum: ['NOT_REQUIRED', 'PENDING', 'PAID', 'REFUNDED'],
      default: 'NOT_REQUIRED'
    },
    paymentDetails: {
      amount: Number,
      transactionId: String,
      paymentDate: Date,
      paymentMode: String
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    confirmedAt: Date,
    cancelledAt: Date,
    cancellationReason: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  indexes: [
    { eventId: 1, studentId: 1 },
    { studentId: 1 },
    { departmentId: 1 },
    { registrationStatus: 1 }
  ]
}
```

### 2.8 PhaseISubmissions Collection

```javascript
{
  collection: "phase_i_submissions",
  schema: {
    _id: ObjectId,
    eventId: {
      type: ObjectId,
      ref: 'Event',
      required: true
    },
    studentId: {
      type: ObjectId,
      ref: 'Student',
      required: true
    },
    departmentId: {
      type: ObjectId,
      ref: 'Department',
      required: true
    },
    academicInfo: {
      year: { type: Number, required: true },
      section: { type: String, required: true }
    },
    eventDetails: {
      eventName: {
        type: String,
        required: true
      },
      eventVenue: {
        type: String,
        required: true
      },
      eventOrganizer: {
        type: String,
        required: true
      },
      eventStartDate: {
        type: Date,
        required: true
      },
      eventEndDate: {
        type: Date,
        required: true
      }
    },
    participantDetails: {
      participationType: {
        type: String,
        enum: ['INDIVIDUAL', 'TEAM'],
        required: true
      },
      teamMembers: [{
        name: String,
        rollNumber: String,
        department: String
      }]
    },
    facultyDetails: {
      mentorId: {
        type: ObjectId,
        ref: 'Faculty',
        required: true
      },
      classAdvisorId: {
        type: ObjectId,
        ref: 'Faculty',
        required: true
      },
      mentorName: String,
      classAdvisorName: String
    },
    documents: {
      selectionProof: {
        url: {
          type: String,
          required: true
        },
        filename: String,
        uploadedAt: Date
      },
      paymentProof: {
        url: String,
        filename: String,
        uploadedAt: Date,
        amount: Number
      },
      odRequestForm: {
        url: {
          type: String,
          required: true
        },
        filename: String,
        uploadedAt: Date
      }
    },
    submissionStatus: {
      type: String,
      enum: [
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'REVISION_REQUIRED'
      ],
      default: 'DRAFT'
    },
    reviewComments: [{
      reviewedBy: {
        type: ObjectId,
        ref: 'User'
      },
      comment: String,
      reviewedAt: Date
    }],
    submittedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    phaseIISubmissionId: {
      type: ObjectId,
      ref: 'PhaseIISubmission'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  indexes: [
    { eventId: 1 },
    { studentId: 1 },
    { departmentId: 1 },
    { submissionStatus: 1 },
    { 'facultyDetails.mentorId': 1 },
    { 'facultyDetails.classAdvisorId': 1 },
    { submittedAt: -1 }
  ]
}
```

### 2.9 PhaseIISubmissions Collection

```javascript
{
  collection: "phase_ii_submissions",
  schema: {
    _id: ObjectId,
    phaseISubmissionId: {
      type: ObjectId,
      ref: 'PhaseISubmission',
      required: true,
      unique: true
    },
    eventId: {
      type: ObjectId,
      ref: 'Event',
      required: true
    },
    studentId: {
      type: ObjectId,
      ref: 'Student',
      required: true
    },
    departmentId: {
      type: ObjectId,
      ref: 'Department',
      required: true
    },
    participationProof: {
      geoTaggedPhoto: {
        url: {
          type: String,
          required: true
        },
        filename: String,
        uploadedAt: Date,
        location: {
          latitude: Number,
          longitude: Number,
          address: String
        },
        metadata: {
          capturedAt: Date,
          deviceInfo: String
        }
      },
      participationDocument: {
        url: {
          type: String,
          required: true
        },
        filename: String,
        uploadedAt: Date
      }
    },
    prizeDetails: {
      wonPrize: {
        type: Boolean,
        default: false
      },
      prizePosition: {
        type: String,
        enum: ['First', 'Second', 'Third', 'Consolation', 'Special Prize', 'NA']
      },
      prizeName: String,
      prizeAmount: {
        type: Number,
        default: 0
      },
      prizeCurrency: {
        type: String,
        default: 'INR'
      }
    },
    certificates: [{
      certificateType: {
        type: String,
        enum: ['Participation', 'Winner', 'Runner-up', 'Special Achievement']
      },
      url: {
        type: String,
        required: true
      },
      filename: String,
      uploadedAt: Date
    }],
    eventReport: {
      reportText: {
        type: String,
        required: true,
        minlength: 100,
        maxlength: 5000
      },
      reportDocument: {
        url: String,
        filename: String,
        uploadedAt: Date
      },
      keyLearnings: [String],
      recommendations: String
    },
    submissionStatus: {
      type: String,
      enum: [
        'NOT_STARTED',
        'DRAFT',
        'SUBMITTED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'REVISION_REQUIRED'
      ],
      default: 'NOT_STARTED'
    },
    reviewComments: [{
      reviewedBy: {
        type: ObjectId,
        ref: 'User'
      },
      comment: String,
      reviewedAt: Date
    }],
    submittedAt: Date,
    approvedAt: Date,
    rejectedAt: Date,
    rejectionReason: String,
    daysPendingSincePhaseI: {
      type: Number,
      default: 0
    },
    isOverdue: {
      type: Boolean,
      default: false
    },
    remindersSent: {
      type: Number,
      default: 0
    },
    lastReminderSentAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  indexes: [
    { phaseISubmissionId: 1 },
    { eventId: 1 },
    { studentId: 1 },
    { departmentId: 1 },
    { submissionStatus: 1 },
    { isOverdue: 1 },
    { submittedAt: -1 }
  ]
}
```

### 2.10 SubmissionTimeline Collection

```javascript
{
  collection: "submission_timeline",
  schema: {
    _id: ObjectId,
    submissionId: {
      type: ObjectId,
      required: true
    },
    submissionType: {
      type: String,
      enum: ['PHASE_I', 'PHASE_II'],
      required: true
    },
    studentId: {
      type: ObjectId,
      ref: 'Student',
      required: true
    },
    eventId: {
      type: ObjectId,
      ref: 'Event',
      required: true
    },
    action: {
      type: String,
      enum: [
        'CREATED',
        'SUBMITTED',
        'UNDER_REVIEW',
        'APPROVED',
        'REJECTED',
        'REVISION_REQUIRED',
        'RESUBMITTED',
        'REMINDER_SENT',
        'COMPLETED'
      ],
      required: true
    },
    performedBy: {
      userId: {
        type: ObjectId,
        ref: 'User'
      },
      role: String,
      name: String
    },
    previousStatus: String,
    newStatus: String,
    comments: String,
    metadata: {
      daysPending: Number,
      reminderCount: Number,
      ipAddress: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  indexes: [
    { submissionId: 1, submissionType: 1 },
    { studentId: 1 },
    { eventId: 1 },
    { action: 1 },
    { timestamp: -1 }
  ]
}
```

### 2.11 Approvals Collection

```javascript
{
  collection: "approvals",
  schema: {
    _id: ObjectId,
    submissionId: {
      type: ObjectId,
      required: true
    },
    submissionType: {
      type: String,
      enum: ['PHASE_I', 'PHASE_II'],
      required: true
    },
    studentId: {
      type: ObjectId,
      ref: 'Student',
      required: true
    },
    eventId: {
      type: ObjectId,
      ref: 'Event',
      required: true
    },
    departmentId: {
      type: ObjectId,
      ref: 'Department',
      required: true
    },
    approverRole: {
      type: String,
      enum: ['MENTOR', 'CLASS_ADVISOR', 'HOD', 'SUPER_ADMIN'],
      required: true
    },
    approverId: {
      type: ObjectId,
      ref: 'User',
      required: true
    },
    approverName: String,
    approvalStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'REVISION_REQUIRED'],
      default: 'PENDING'
    },
    comments: String,
    revisionNotes: String,
    approvedAt: Date,
    rejectedAt: Date,
    requestedAt: {
      type: Date,
      default: Date.now
    },
    responseTime: Number,  // in hours
    attachments: [{
      url: String,
      filename: String
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  indexes: [
    { submissionId: 1, submissionType: 1 },
    { approverId: 1, approvalStatus: 1 },
    { studentId: 1 },
    { departmentId: 1 },
    { approvalStatus: 1 }
  ]
}
```

### 2.12 Notifications Collection

```javascript
{
  collection: "notifications",
  schema: {
    _id: ObjectId,
    recipientId: {
      type: ObjectId,
      ref: 'User',
      required: true
    },
    recipientRole: {
      type: String,
      enum: ['STUDENT', 'FACULTY', 'HOD', 'SUPER_ADMIN']
    },
    notificationType: {
      type: String,
      enum: [
        'EVENT_CREATED',
        'EVENT_REMINDER',
        'SUBMISSION_CREATED',
        'SUBMISSION_APPROVED',
        'SUBMISSION_REJECTED',
        'APPROVAL_REQUESTED',
        'PHASE_II_OVERDUE',
        'PRIZE_ANNOUNCED',
        'SYSTEM_ALERT'
      ],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    relatedEntity: {
      entityType: {
        type: String,
        enum: ['EVENT', 'SUBMISSION', 'APPROVAL', 'USER']
      },
      entityId: ObjectId
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      default: 'MEDIUM'
    },
    channels: [{
      type: String,
      enum: ['IN_APP', 'EMAIL', 'WHATSAPP', 'SMS']
    }],
    status: {
      isRead: {
        type: Boolean,
        default: false
      },
      readAt: Date,
      isSent: {
        type: Boolean,
        default: false
      },
      sentAt: Date
    },
    actionUrl: String,
    expiresAt: Date,
    createdAt: { type: Date, default: Date.now }
  },
  indexes: [
    { recipientId: 1, 'status.isRead': 1 },
    { notificationType: 1 },
    { createdAt: -1 },
    { expiresAt: 1 }
  ]
}
```

### 2.13 WhatsAppLogs Collection

```javascript
{
  collection: "whatsapp_logs",
  schema: {
    _id: ObjectId,
    recipientId: {
      type: ObjectId,
      ref: 'User',
      required: true
    },
    recipientName: String,
    recipientPhone: {
      type: String,
      required: true
    },
    messageType: {
      type: String,
      enum: [
        'PHASE_II_REMINDER',
        'EVENT_NOTIFICATION',
        'APPROVAL_REQUEST',
        'SYSTEM_ALERT'
      ],
      required: true
    },
    messageContent: {
      type: String,
      required: true
    },
    relatedSubmission: {
      submissionId: ObjectId,
      submissionType: String,
      studentId: ObjectId,
      studentName: String,
      eventId: ObjectId,
      eventName: String,
      daysPending: Number
    },
    deliveryStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
      default: 'PENDING'
    },
    twilioResponse: {
      messageSid: String,
      status: String,
      errorCode: String,
      errorMessage: String
    },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    failedAt: Date,
    retryCount: {
      type: Number,
      default: 0
    },
    createdAt: { type: Date, default: Date.now }
  },
  indexes: [
    { recipientId: 1 },
    { messageType: 1 },
    { deliveryStatus: 1 },
    { 'relatedSubmission.submissionId': 1 },
    { sentAt: -1 }
  ]
}
```

### 2.14 ExcelImportLogs Collection

```javascript
{
  collection: "excel_import_logs",
  schema: {
    _id: ObjectId,
    importedBy: {
      userId: {
        type: ObjectId,
        ref: 'User',
        required: true
      },
      role: String,
      name: String
    },
    importType: {
      type: String,
      enum: [
        'STUDENTS',
        'FACULTY',
        'DEPARTMENTS',
        'CLASS_MAPPING',
        'MENTOR_MAPPING',
        'MASTER_IMPORT'
      ],
      required: true
    },
    departmentId: {
      type: ObjectId,
      ref: 'Department'
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: Number,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    processingStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL'],
      default: 'PENDING'
    },
    statistics: {
      totalRows: { type: Number, default: 0 },
      successfulRows: { type: Number, default: 0 },
      failedRows: { type: Number, default: 0 },
      duplicateRows: { type: Number, default: 0 },
      skippedRows: { type: Number, default: 0 }
    },
    errors: [{
      rowNumber: Number,
      columnName: String,
      errorType: String,
      errorMessage: String,
      actualValue: String
    }],
    errorReportUrl: String,
    warnings: [{
      rowNumber: Number,
      warningMessage: String
    }],
    importedData: {
      studentIds: [ObjectId],
      facultyIds: [ObjectId],
      departmentIds: [ObjectId]
    },
    processingStartedAt: Date,
    processingCompletedAt: Date,
    processingDuration: Number,  // in seconds
    createdAt: { type: Date, default: Date.now }
  },
  indexes: [
    { 'importedBy.userId': 1 },
    { importType: 1 },
    { departmentId: 1 },
    { processingStatus: 1 },
    { uploadedAt: -1 }
  ]
}
```

---

## 3. Database Indexes Strategy

### 3.1 Performance Indexes

| Collection | Index | Type | Purpose |
|------------|-------|------|---------|
| users | { email: 1 } | Unique | Login authentication |
| users | { role: 1, departmentId: 1 } | Compound | Role-based queries |
| students | { rollNumber: 1 } | Unique | Student lookup |
| students | { departmentId: 1, year: 1, section: 1 } | Compound | Class-wise queries |
| faculty | { employeeId: 1 } | Unique | Faculty lookup |
| events | { scope: 1, status: 1 } | Compound | Event filtering |
| events | { title: 'text', description: 'text' } | Text | Full-text search |
| phase_i_submissions | { studentId: 1, submissionStatus: 1 } | Compound | Student submissions |
| phase_ii_submissions | { isOverdue: 1, submissionStatus: 1 } | Compound | Overdue tracking |
| approvals | { approverId: 1, approvalStatus: 1 } | Compound | Approval queue |
| notifications | { recipientId: 1, isRead: 1 } | Compound | Unread notifications |

### 3.2 TTL Indexes (Auto-deletion)

```javascript
// Notifications - Auto delete after 90 days
db.notifications.createIndex(
  { "createdAt": 1 },
  { expireAfterSeconds: 7776000 }  // 90 days
);

// WhatsApp Logs - Auto delete after 180 days
db.whatsapp_logs.createIndex(
  { "createdAt": 1 },
  { expireAfterSeconds: 15552000 }  // 180 days
);
```

---

## 4. Data Validation Rules

### 4.1 Mongoose Schema Validators

```javascript
// Example: Email validation
email: {
  type: String,
  validate: {
    validator: function(v) {
      return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
    },
    message: props => `${props.value} is not a valid email!`
  }
}

// Example: Phone number validation (Indian format)
phoneNumber: {
  type: String,
  validate: {
    validator: function(v) {
      return /^[6-9]\d{9}$/.test(v);
    },
    message: props => `${props.value} is not a valid Indian phone number!`
  }
}

// Example: Date range validation
eventDates: {
  validate: {
    validator: function(v) {
      return this.dates.endDate >= this.dates.startDate;
    },
    message: 'End date must be greater than or equal to start date'
  }
}
```

### 4.2 Business Logic Validators

1. **Phase II Submission Window**
   - Must be submitted within 14 days of Phase I approval
   - System tracks and marks as overdue

2. **File Upload Validators**
   - File types: PDF, JPG, PNG only
   - Max file size: 5MB per file
   - Total upload limit: 50MB per submission

3. **Excel Import Validators**
   - Required columns validation
   - Data type validation
   - Duplicate detection
   - Foreign key validation

---

## 5. Data Relationships Summary

```
Department (1) ──── (N) Faculty
     │                    │
     │                    │ (Mentor/Advisor)
     │                    │
     │                    ▼
     └────────────── (N) Student
                          │
                          │ (registers)
                          ▼
                        Event
                          │
                          │ (participates)
                          ▼
                  Phase I Submission ──── (1:1) ──── Phase II Submission
                          │                                   │
                          │                                   │
                          └────────────► Approval ◄───────────┘
                                          │
                                          │
                                          ▼
                                    Notification
                                          │
                                          │
                                          ▼
                                    WhatsApp Log
```

---

## Document Information

- **Version:** 1.0
- **Last Updated:** December 2, 2025
- **Schema Design:** Production-ready MongoDB collections
- **Total Collections:** 14

