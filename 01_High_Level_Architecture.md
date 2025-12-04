# High-Level Architecture Document
## Institution-Wide Student Participation Tracking System

---

## 1. System Architecture Overview

### 1.1 Architecture Pattern
**MERN Stack with Layered Architecture**

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer (React.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Student    │  │   Faculty    │  │     HoD      │              │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Super Admin  │  │  Event Mgmt  │  │  Analytics   │              │
│  │  Dashboard   │  │    Module    │  │   Reports    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS/REST API
┌─────────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer (Express.js)                  │
│                     ┌─────────────────────────────┐                 │
│                     │   Authentication Middleware  │                 │
│                     │   (JWT + Role-Based Auth)   │                 │
│                     └─────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer (Node.js)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │   User   │ │  Event   │ │Submission│ │ Approval │              │
│  │ Service  │ │ Service  │ │ Service  │ │ Service  │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │Analytics │ │  Excel   │ │Notification││WhatsApp │              │
│  │ Service  │ │ Service  │ │  Service  │ │ Service │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                    Data Access Layer (Mongoose ODM)                  │
│                     ┌─────────────────────────────┐                 │
│                     │      Models & Schemas       │                 │
│                     │    Validation & Indexing    │                 │
│                     └─────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────────────┐
│                    Database Layer (MongoDB)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │  Users   │ │ Events   │ │Submissions││ Approvals│              │
│  │Collection│ │Collection│ │Collection │ │Collection│              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React.js | 18.2+ | UI Component Library |
| **State Management** | Redux Toolkit | 1.9+ | Global State Management |
| **Routing** | React Router | 6.x | Client-Side Routing |
| **UI Framework** | Material-UI (MUI) | 5.x | Component Library |
| **Charts** | Chart.js + react-chartjs-2 | 4.x | Data Visualization |
| **Forms** | Formik + Yup | Latest | Form Handling & Validation |
| **HTTP Client** | Axios | 1.x | API Communication |
| **File Upload** | React Dropzone | 14.x | File Upload Handler |
| **Excel Processing** | XLSX (SheetJS) | 0.18+ | Excel Import/Export |
| **Date Handling** | date-fns | 2.x | Date Utilities |
| **Notifications** | React Toastify | 9.x | Toast Notifications |

### 2.2 Backend Technologies

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 18+ LTS | JavaScript Runtime |
| **Framework** | Express.js | 4.18+ | Web Application Framework |
| **ODM** | Mongoose | 7.x | MongoDB Object Modeling |
| **Authentication** | jsonwebtoken | 9.x | JWT Token Generation |
| **Password Hashing** | bcryptjs | 2.4+ | Password Encryption |
| **Validation** | Joi | 17.x | Request Validation |
| **File Upload** | Multer | 1.4+ | Multipart Form Data |
| **Excel Processing** | exceljs | 4.3+ | Excel Generation/Parsing |
| **WhatsApp API** | Twilio WhatsApp API | Latest | WhatsApp Messaging |
| **Scheduled Jobs** | node-cron | 3.x | Automated Reminders |
| **Email Service** | Nodemailer | 6.9+ | Email Notifications |
| **Logging** | Winston | 3.x | Application Logging |
| **Environment Config** | dotenv | 16.x | Environment Variables |
| **CORS** | cors | 2.8+ | Cross-Origin Resource Sharing |

### 2.3 Database & Storage

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Database** | MongoDB Atlas | Primary Database (Cloud) |
| **File Storage** | AWS S3 / Cloudinary | Document & Image Storage |
| **Caching** | Redis (Optional) | Session & Query Caching |
| **Backup** | MongoDB Backup Service | Automated Backups |

### 2.4 DevOps & Deployment

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Version Control** | Git + GitHub | Source Code Management |
| **CI/CD** | GitHub Actions | Automated Deployment |
| **Containerization** | Docker | Application Containerization |
| **Hosting (Frontend)** | Vercel / Netlify | React App Hosting |
| **Hosting (Backend)** | AWS EC2 / Render / Railway | Node.js API Hosting |
| **Process Manager** | PM2 | Node.js Process Management |
| **Reverse Proxy** | Nginx | Load Balancing & SSL |
| **SSL Certificates** | Let's Encrypt | HTTPS Encryption |
| **Monitoring** | PM2 + CloudWatch | Application Monitoring |

---

## 3. System Components

### 3.1 Frontend Components Architecture

```
src/
├── components/
│   ├── common/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Footer.jsx
│   │   ├── FileUploader.jsx
│   │   ├── DataTable.jsx
│   │   └── Charts/
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ProtectedRoute.jsx
│   ├── student/
│   │   ├── StudentDashboard.jsx
│   │   ├── EventList.jsx
│   │   ├── PhaseIForm.jsx
│   │   ├── PhaseIIForm.jsx
│   │   └── SubmissionTracker.jsx
│   ├── faculty/
│   │   ├── FacultyDashboard.jsx
│   │   ├── EventManagement.jsx
│   │   ├── StudentMonitoring.jsx
│   │   └── ApprovalQueue.jsx
│   ├── hod/
│   │   ├── HoDDashboard.jsx
│   │   ├── DepartmentReports.jsx
│   │   ├── ApprovalManagement.jsx
│   │   └── ExcelUpload.jsx
│   ├── superadmin/
│   │   ├── SuperAdminDashboard.jsx
│   │   ├── InstitutionReports.jsx
│   │   ├── DepartmentManagement.jsx
│   │   ├── UserManagement.jsx
│   │   └── ExcelTemplates.jsx
│   └── reports/
│       ├── AdvancedReports.jsx
│       ├── CustomFilters.jsx
│       └── ExportOptions.jsx
├── redux/
│   ├── store.js
│   ├── slices/
│   │   ├── authSlice.js
│   │   ├── eventSlice.js
│   │   ├── submissionSlice.js
│   │   └── reportSlice.js
│   └── api/
│       └── apiService.js
├── utils/
│   ├── constants.js
│   ├── validators.js
│   ├── helpers.js
│   └── excelHelpers.js
├── hooks/
│   ├── useAuth.js
│   ├── usePermissions.js
│   └── useNotification.js
└── App.jsx
```

### 3.2 Backend Components Architecture

```
server/
├── config/
│   ├── database.js          # MongoDB connection
│   ├── jwt.js               # JWT configuration
│   ├── multer.js            # File upload config
│   └── whatsapp.js          # WhatsApp API config
├── models/
│   ├── User.js
│   ├── Department.js
│   ├── Student.js
│   ├── Faculty.js
│   ├── Event.js
│   ├── PhaseISubmission.js
│   ├── PhaseIISubmission.js
│   ├── Approval.js
│   ├── Notification.js
│   ├── WhatsAppLog.js
│   └── ExcelImportLog.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── departmentController.js
│   ├── eventController.js
│   ├── submissionController.js
│   ├── approvalController.js
│   ├── excelController.js
│   ├── reportController.js
│   └── notificationController.js
├── services/
│   ├── authService.js
│   ├── emailService.js
│   ├── whatsappService.js
│   ├── excelService.js
│   ├── fileUploadService.js
│   ├── reportService.js
│   └── reminderService.js
├── middleware/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   ├── validationMiddleware.js
│   ├── errorHandler.js
│   └── uploadMiddleware.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── departmentRoutes.js
│   ├── eventRoutes.js
│   ├── submissionRoutes.js
│   ├── approvalRoutes.js
│   ├── excelRoutes.js
│   └── reportRoutes.js
├── validators/
│   ├── userValidator.js
│   ├── eventValidator.js
│   ├── submissionValidator.js
│   └── excelValidator.js
├── jobs/
│   ├── reminderJob.js       # Automated WhatsApp reminders
│   └── cleanupJob.js        # Periodic cleanup tasks
├── utils/
│   ├── logger.js
│   ├── helpers.js
│   └── constants.js
└── server.js                # Entry point
```

---

## 4. Data Flow Architecture

### 4.1 Authentication Flow

```
┌─────────┐     1. Login Request      ┌─────────────┐
│  Client │ ─────────────────────────> │   Express   │
└─────────┘                            │   Server    │
     ▲                                 └─────────────┘
     │                                        │
     │                                        │ 2. Validate
     │                                        ▼
     │                                 ┌─────────────┐
     │                                 │   MongoDB   │
     │                                 │   (Users)   │
     │                                 └─────────────┘
     │                                        │
     │ 4. JWT Token + User Data               │ 3. User Found
     │ <──────────────────────────────────────┘
     │
     │ 5. Store Token (localStorage)
     │
     │ 6. Subsequent Requests
     │    (Authorization: Bearer <token>)
     │ ─────────────────────────────────────>
     │
     │ 7. Token Verification
     │    + Role-Based Access Control
```

### 4.2 Event Participation Flow

```
Student Submits Phase I
         │
         ▼
┌────────────────────┐
│  Validation Check  │
└────────────────────┘
         │
         ▼
┌────────────────────┐
│ Store in Database  │
│ (Status: Phase I)  │
└────────────────────┘
         │
         ├──> Notify Class Advisor
         ├──> Notify Mentor
         └──> Notify HoD (if required)
         │
         ▼
    [Event Occurs]
         │
         ▼
┌────────────────────┐
│ Student Submits    │
│    Phase II        │
│ (within 14 days)   │
└────────────────────┘
         │
         ├──> YES ──> Update Status: Completed
         │
         └──> NO (14+ days)
                │
                ▼
        ┌──────────────────┐
        │ Auto WhatsApp     │
        │ Reminder Sent     │
        │ to Advisor/Mentor │
        └──────────────────┘
```

### 4.3 Excel Upload Flow

```
Admin/HoD Uploads Excel
         │
         ▼
┌────────────────────────┐
│  File Validation       │
│  (Format, Size, Type)  │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  Parse Excel Data      │
│  (XLSX Library)        │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│  Data Validation       │
│  Row-by-Row            │
└────────────────────────┘
         │
         ├──> Errors Found ──> Generate Error Report
         │                     (Downloadable Excel)
         │
         └──> All Valid
                │
                ▼
        ┌──────────────────┐
        │ Bulk Insert to DB │
        │ with Mapping      │
        └──────────────────┘
                │
                ▼
        ┌──────────────────┐
        │  Log Import       │
        │  Activity         │
        └──────────────────┘
                │
                ▼
        ┌──────────────────┐
        │  Success Response │
        │  with Summary     │
        └──────────────────┘
```

---

## 5. Security Architecture

### 5.1 Security Layers

| Layer | Security Measure | Implementation |
|-------|------------------|----------------|
| **Authentication** | JWT-based authentication | jsonwebtoken library |
| **Authorization** | Role-Based Access Control (RBAC) | Custom middleware |
| **Password Security** | Bcrypt hashing (10 rounds) | bcryptjs |
| **API Security** | Rate limiting | express-rate-limit |
| **Data Validation** | Input sanitization | Joi validators |
| **File Upload Security** | File type & size validation | Multer + custom validators |
| **HTTPS** | SSL/TLS encryption | Let's Encrypt certificates |
| **CORS** | Restricted origins | cors middleware |
| **SQL Injection Prevention** | MongoDB (NoSQL) | Mongoose ODM |
| **XSS Prevention** | Input sanitization | express-validator |
| **Session Management** | JWT expiration (24h) | JWT configuration |

### 5.2 Role-Based Access Control (RBAC)

```javascript
const permissions = {
  SUPER_ADMIN: {
    departments: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    events: ['create', 'read', 'update', 'delete'],
    approvals: ['approve', 'reject'],
    reports: ['all_institution'],
    excel: ['upload', 'download_templates']
  },
  HOD: {
    departments: ['read:own'],
    users: ['create:own_dept', 'read:own_dept', 'update:own_dept'],
    events: ['create:own_dept', 'read:own_dept', 'update:own_dept'],
    approvals: ['approve:own_dept', 'reject:own_dept'],
    reports: ['department_level'],
    excel: ['upload:own_dept', 'download_templates']
  },
  FACULTY: {
    events: ['create', 'read', 'update:own'],
    students: ['read:assigned', 'monitor:assigned'],
    approvals: ['view:assigned'],
    reports: ['students_assigned'],
    submissions: ['view:assigned']
  },
  STUDENT: {
    events: ['read', 'register'],
    submissions: ['create', 'read:own', 'update:own'],
    reports: ['view:own']
  }
};
```

---

## 6. Integration Architecture

### 6.1 External Integrations

```
┌────────────────────────────────────────────────────────┐
│                    MERN Application                     │
└────────────────────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Twilio    │  │   AWS S3 /  │  │  MongoDB    │
│  WhatsApp   │  │ Cloudinary  │  │   Atlas     │
│     API     │  │   Storage   │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 6.2 WhatsApp Reminder Integration

**Provider:** Twilio WhatsApp Business API

**Configuration:**
```javascript
// config/whatsapp.js
{
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER
}
```

**Message Format:**
```
🔔 Reminder: Phase II Pending

Student: [Student Name]
Event: [Event Name]
Days Pending: [X days]

Please follow up with the student to complete Phase II submission.

- [Institution Name]
```

### 6.3 File Storage Integration

**Options:**
1. **AWS S3** (Recommended for production)
   - Scalable storage
   - CDN integration
   - Cost-effective

2. **Cloudinary** (Alternative)
   - Image optimization
   - Easy integration
   - Free tier available

**File Organization:**
```
bucket/
├── od-forms/
│   └── {studentId}/{submissionId}/od-form.pdf
├── selection-proofs/
│   └── {studentId}/{submissionId}/proof.pdf
├── payment-proofs/
│   └── {studentId}/{submissionId}/payment.pdf
├── geo-tagged-photos/
│   └── {studentId}/{submissionId}/photo.jpg
├── participation-proofs/
│   └── {studentId}/{submissionId}/proof.pdf
└── certificates/
    └── {studentId}/{submissionId}/certificate.pdf
```

---

## 7. Scalability Considerations

### 7.1 Horizontal Scaling

- **Load Balancer:** Nginx reverse proxy
- **Multiple Node.js Instances:** PM2 cluster mode
- **Database Sharding:** MongoDB sharding for large datasets
- **CDN:** CloudFront/Cloudflare for static assets

### 7.2 Vertical Scaling

- **Database Indexing:** Optimized MongoDB indexes
- **Caching Layer:** Redis for frequently accessed data
- **Connection Pooling:** MongoDB connection pooling

### 7.3 Performance Optimization

| Component | Optimization Strategy |
|-----------|----------------------|
| **API Response Time** | Implement pagination, limit query results |
| **Database Queries** | Use aggregation pipeline, proper indexing |
| **File Uploads** | Stream processing, chunked uploads |
| **Reports Generation** | Background job processing |
| **Frontend Loading** | Code splitting, lazy loading |
| **Static Assets** | Compression, minification, CDN |

---

## 8. Monitoring & Logging

### 8.1 Application Monitoring

- **Tool:** PM2 + AWS CloudWatch / Datadog
- **Metrics:**
  - API response times
  - Error rates
  - Memory usage
  - CPU usage
  - Active users

### 8.2 Logging Strategy

**Log Levels:**
- `ERROR`: Application errors
- `WARN`: Warning messages
- `INFO`: General information
- `DEBUG`: Debug information

**Log Storage:**
- Local files (development)
- CloudWatch Logs (production)
- Log rotation: Daily, max 14 days

---

## 9. Disaster Recovery

### 9.1 Backup Strategy

| Component | Frequency | Retention |
|-----------|-----------|-----------|
| **MongoDB Database** | Daily (automated) | 30 days |
| **File Storage (S3)** | Versioning enabled | Indefinite |
| **Application Code** | Git commits | Indefinite |
| **Configuration** | Manual backup | Before changes |

### 9.2 Recovery Plan

1. **Database Recovery:** Restore from MongoDB Atlas automated backup
2. **File Recovery:** Restore from S3 versioning
3. **Application Recovery:** Redeploy from Git repository
4. **RTO (Recovery Time Objective):** < 1 hour
5. **RPO (Recovery Point Objective):** < 24 hours

---

## 10. Development Workflow

### 10.1 Environment Setup

```
Development ──> Testing ──> Staging ──> Production
     │             │           │            │
     │             │           │            │
  localhost    test.db    staging.db   production.db
  (MongoDB)   (MongoDB)   (MongoDB)    (MongoDB Atlas)
```

### 10.2 CI/CD Pipeline

```yaml
# GitHub Actions Workflow
on: [push]
jobs:
  build:
    - Install dependencies
    - Run linters
    - Run unit tests
    - Build application
  deploy:
    - Deploy to staging (on dev branch)
    - Deploy to production (on main branch)
    - Run smoke tests
```

---

## Document Information

- **Version:** 1.0
- **Last Updated:** December 2, 2025
- **Author:** System Architect
- **Status:** Final Draft

