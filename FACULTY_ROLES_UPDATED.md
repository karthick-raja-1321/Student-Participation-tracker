# Faculty Role Management - Updated

**Date:** December 4, 2025  
**Status:** ✅ Complete

---

## Changes Made

### 1. Faculty Model Enhanced
**File:** `server/src/models/Faculty.js`

Added support for faculty roles with detailed tracking:
- **Class Advisor Role:**
  - `isClassAdvisor`: Boolean flag
  - `advisorForClasses`: Array with year, section, and departmentId
  - Format: Year, Section, Department
  
- **Innovation Coordinator Role:**
  - `isInnovationCoordinator`: Boolean flag
  - `innovationCoordinatorFor`: Array of department IDs

- **Mentor Role:** (unchanged for Phase I submissions)

### 2. Excel Template Updated
**File:** `server/src/routes/excel.routes.js`

New columns in Faculty Excel template:

| Column | Format | Example | Description |
|--------|--------|---------|-------------|
| Employee ID | Text | FAC001 | Unique identifier |
| First Name | Text | Jane | First name |
| Last Name | Text | Smith | Last name |
| Email | Email | jane@example.com | Email address |
| Department Code | Text | CSE | Department code |
| Designation | Text | Assistant Professor | Job title |
| Phone | Text | 9876543210 | Phone number |
| **Class Advisor** | "Y S D" | "2 CSE A" | Year Section (e.g., "2 CSE A" for 2nd year CSE A section) |
| **Is Innovation Coordinator** | TRUE/FALSE | TRUE | Whether faculty is innovation coordinator |

### 3. Faculty Import Logic Enhanced
**File:** `server/src/controllers/excel.controller.js`

Parser now:
- ✅ Extracts class advisor info in format "2 CSE A" (Year Section)
- ✅ Parses innovation coordinator flag (TRUE/FALSE)
- ✅ Validates and stores both roles in faculty record
- ✅ Sets `advisorForClasses` with year, section, departmentId
- ✅ Sets `innovationCoordinatorFor` with department array

---

## Excel Template Examples

### Example 1: Class Advisor Only
```
Employee ID | First Name | Last Name | Email         | Department | Designation          | Phone      | Class Advisor | Is Innovation Coordinator
FAC001      | Jane       | Smith     | jane@...      | CSE        | Assistant Professor  | 9876543210 | 2 CSE A       | FALSE
```

### Example 2: Innovation Coordinator + Class Advisor
```
FAC002      | John       | Doe       | john@...      | CSE        | Associate Professor  | 9876543211 | 1 CSE B       | TRUE
```

### Example 3: No Special Roles
```
FAC003      | Alice      | Johnson   | alice@...     | CSE        | Lecturer             | 9876543212 |               | FALSE
```

---

## Data Storage

After import, faculty record looks like:

### Class Advisor Faculty
```javascript
{
  employeeId: 'FAC001',
  firstName: 'Jane',
  lastName: 'Smith',
  isClassAdvisor: true,
  advisorForClasses: [{
    year: 2,
    section: 'A',
    departmentId: ObjectId('...')
  }],
  isInnovationCoordinator: false,
  innovationCoordinatorFor: []
}
```

### Innovation Coordinator + Class Advisor
```javascript
{
  employeeId: 'FAC002',
  firstName: 'John',
  lastName: 'Doe',
  isClassAdvisor: true,
  advisorForClasses: [{
    year: 1,
    section: 'B',
    departmentId: ObjectId('...')
  }],
  isInnovationCoordinator: true,
  innovationCoordinatorFor: [ObjectId('...')]
}
```

---

## Class Advisor Format

### How to Specify Class Advisor

**Format:** `{YEAR} {DEPT} {SECTION}`

**Examples:**
- `2 CSE A` → Class Advisor for 2nd Year CSE A section
- `1 CSE B` → Class Advisor for 1st Year CSE B section
- `3 ECE A` → Class Advisor for 3rd Year ECE A section
- `4 MECH C` → Class Advisor for 4th Year Mechanical C section

**If NOT a class advisor:** Leave blank or use "FALSE"

---

## Innovation Coordinator

**Format:** `TRUE` or `FALSE`

- `TRUE` → Faculty is an Innovation Coordinator for their department
- `FALSE` → Faculty is not an Innovation Coordinator

---

## Validation Rules

✅ Class Advisor format must be: `{number} {DEPT_CODE} {LETTER}`
✅ Year must be a number (1-4)
✅ Section must be a single letter (A-Z)
✅ Department code must match existing department
✅ Innovation Coordinator must be TRUE or FALSE

❌ Invalid: "Admin CSE" (no year)
❌ Invalid: "5 CSE A" (invalid year)
❌ Invalid: "2 CSE AB" (multiple section letters)

---

## How to Download & Use

### Step 1: Download Template
1. Go to **Admin Dashboard** → **Excel Management**
2. Click **"Download Template"** → Select **"Faculty"**
3. Excel file with new columns downloads

### Step 2: Fill In Data
- Complete all required fields (columns 1-6)
- For Class Advisor: Enter "2 CSE A" format
- For Innovation Coordinator: Enter TRUE or FALSE

### Step 3: Upload
1. Click **"Upload Faculty"**
2. Select your filled Excel file
3. Click **"Upload"**
4. See import results

---

## API Response

After successful import:
```json
{
  "status": "success",
  "message": "Imported 10 of 10 faculty members",
  "data": {
    "total": 10,
    "successful": 10,
    "failed": 0,
    "errors": []
  }
}
```

---

## Benefits

✅ Flexible role assignment (single or multiple roles)
✅ Easy class advisor tracking (which year/section each faculty handles)
✅ Clear innovation coordinator identification
✅ Department-specific role management
✅ Simple Excel-based import/management

---

## Backward Compatibility

✅ Existing faculty records continue to work
✅ New fields default to false/empty
✅ Can be updated via Excel import anytime

---

**All Systems:** ✅ Ready  
**Template:** ✅ Updated  
**Import Logic:** ✅ Enhanced  
