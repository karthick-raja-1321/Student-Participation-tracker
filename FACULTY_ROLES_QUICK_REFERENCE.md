# Faculty Role Management - Quick Reference Guide

**Status:** ✅ Production Ready | **Date:** December 4, 2025

---

## 🎯 Quick Start

### Add Faculty with Roles

1. **Click "Add Faculty" button**
2. **Fill Basic Info:**
   - First Name, Last Name, Email, Phone
   - Employee ID, Department, Designation

3. **Assign Roles:**
   - ☑ Class Advisor → Enter Year (1-4) & Section (A-Z)
   - ☑ Innovation Coordinator → Just check the box

4. **Click "Save"** → Faculty created with roles

### Edit Faculty

1. **Click "Edit" on faculty row**
2. **Modify any field including roles**
3. **Click "Update"** → Changes saved

### View Roles

**Roles Column in Table:**
- `2 A` = Class Advisor Year 2 Section A
- `Innovation Coordinator` = Has IC role
- `2 A, Innovation Coordinator` = Both roles
- `No roles` = No special roles

---

## 📊 Excel Template

**Get Template:** Click "Get Template" → Downloads Excel file

### Fill Template Columns

| Column | Example | Format |
|--------|---------|--------|
| First Name | John | Text |
| Last Name | Doe | Text |
| Email | john@college.edu | Email |
| Phone | 9876543210 | Text |
| Employee ID | FAC001 | Text |
| Department | Computer Science | Text (must match database) |
| Designation | Assistant Professor | Text |
| **Class Advisor** | **2 CSE A** | **"Y CODE S" or blank** |
| **Is Innovation Coordinator** | **TRUE** | **TRUE or FALSE** |

### Class Advisor Format
- Format: `Year Department Section` (e.g., `2 CSE A`)
- Year: 1-4 (required if not blank)
- Department: Must match a department code (e.g., CSE, ECE, MECH)
- Section: Single letter A-Z (must exist for that department)
- Leave blank if not a class advisor

### Innovation Coordinator
- **TRUE** = Is Innovation Coordinator
- **FALSE** = Not an Innovation Coordinator
- (Leave blank for FALSE)

### Upload
1. **Fill Excel template** with faculty data
2. **Click "Upload"** in Excel section
3. **Select Excel file** (.xlsx or .xls)
4. **Confirm** → Faculty imported with roles

---

## 🔄 Data Flow

```
USER INPUT (Form/Excel)
         ↓
   VALIDATION
    (Frontend/Backend)
         ↓
  API ENDPOINT
 (POST/PUT /faculty)
         ↓
  DATABASE
  (MongoDB)
         ↓
  DISPLAY IN TABLE
```

---

## ✅ Validation Rules

### Form Fields (Required)
- ✓ First Name, Last Name
- ✓ Email (valid format)
- ✓ Employee ID
- ✓ Department

### Role Fields (Conditional)
- ✓ If Class Advisor checked → Year (1-4) & Section (A-Z) required
- ✓ Innovation Coordinator → Optional

### Excel Validation
- ✓ Class Advisor format: `Y CODE S` (e.g., `2 CSE A`)
- ✓ Section must exist in selected department
- ✓ Year must be 1-4

---

## 🛠️ API Endpoints

### GET /api/faculty
**Get all faculty with roles**
```json
Response: { status: "success", data: { faculty: [...] } }
```

### GET /api/faculty/:id
**Get specific faculty with roles**
```json
Response: { status: "success", data: { faculty: {...} } }
```

### POST /api/faculty
**Create faculty with roles**
```json
Request: {
  "userData": { firstName, lastName, email, ... },
  "facultyData": {
    ...,
    "isClassAdvisor": true,
    "classAdvisorClasses": [{ year, section, departmentId }],
    "isInnovationCoordinator": true
  }
}
```

### PUT /api/faculty/:id
**Update faculty roles**
```json
Request: {
  "facultyData": {
    "isClassAdvisor": true,
    "classAdvisorClasses": [{ year, section, departmentId }],
    "isInnovationCoordinator": false
  }
}
```

---

## 📋 Examples

### Example 1: Class Advisor Only
```
Name: Rajesh Kumar
Employee ID: FAC001
Department: CSE
Class Advisor: ✓ Year 2, Section A
Innovation Coordinator: ☐

Result in Table: "2 A"
```

### Example 2: Innovation Coordinator Only
```
Name: Priya Sharma
Employee ID: FAC002
Department: CSE
Class Advisor: ☐
Innovation Coordinator: ✓

Result in Table: "Innovation Coordinator"
```

### Example 3: Both Roles
```
Name: Amit Patel
Employee ID: FAC003
Department: CSE
Class Advisor: ✓ Year 3, Section B
Innovation Coordinator: ✓

Result in Table: "3 B, Innovation Coordinator"
```

### Example 4: Excel Import
```
Excel Row:
Rajesh | Kumar | rajesh@... | 9876543210 | FAC001 | Computer Science | Asst Prof | 2 CSE A | TRUE

Result:
- Creates faculty with Class Advisor role (Year 2, Section A)
- Sets as Innovation Coordinator
- Table shows: "2 A, Innovation Coordinator"
```

---

## 🐛 Troubleshooting

### "Invalid File Type" when uploading Excel
- **Fix:** ✅ Already resolved (MIME types updated)
- File must be .xlsx or .xls format

### "Please fill Class Advisor year and section"
- **Cause:** Class Advisor checkbox checked but fields empty
- **Fix:** Either uncheck it OR fill both Year and Section

### Excel Import Shows Error
- **Check:** Class Advisor format is exactly "Y CODE S" (e.g., "2 CSE A")
- **Check:** Year is 1-4
- **Check:** Department code matches database
- **Check:** Section letter matches department sections

### Role Not Saving
- **Check:** Form validation passed (no error messages)
- **Check:** Year/Section filled if Class Advisor checked
- **Check:** Department is valid

---

## 🎨 UI Features

### Add Faculty Dialog
```
[First Name ]  [Last Name ]
[Email          ]  [Phone          ]
[Employee ID    ]
[Department     ▼]
[Designation    ]

☐ Class Advisor
  [Year 1-4] [Section A-Z] (conditional)
☐ Innovation Coordinator

[Cancel] [Save]
```

### Faculty Table
```
| Name | Email | Employee ID | Department | Designation | Roles | Actions |
|------|-------|-------------|------------|-------------|-------|---------|
| John | john@ | FAC001      | CSE        | Asst Prof   | 2 A   | Edit Del |
```

### Table Role Display
- Class Advisor: `Y S` format (e.g., `2 A`, `3 B`)
- Innovation Coordinator: `Innovation Coordinator` label
- Both: `Y S, Innovation Coordinator` (e.g., `2 A, Innovation Coordinator`)
- None: `No roles` or `-`

---

## 📁 Files Modified

### Backend
- ✅ `server/src/models/Faculty.js` - Model schema updated
- ✅ `server/src/controllers/excel.controller.js` - Import logic enhanced
- ✅ `server/src/routes/excel.routes.js` - Template columns added
- ✅ `server/src/config/constants.js` - Excel MIME types fixed

### Frontend
- ✅ `client/src/pages/faculty/Faculty.jsx` - UI components added

---

## 🚀 Key Features

✅ **Add Faculty** with Class Advisor and Innovation Coordinator roles  
✅ **Edit Faculty** to modify roles anytime  
✅ **Excel Import** with role data support  
✅ **Excel Export** template with role columns  
✅ **Form Validation** for all fields and roles  
✅ **API Validation** for role data  
✅ **Table Display** showing assigned roles  
✅ **Backward Compatible** - existing data unaffected  

---

## 📞 Support

**Issue:** Faculty not showing in table after adding
- **Solution:** Check browser console for errors
- **Solution:** Ensure department is valid
- **Solution:** Refresh page if needed

**Issue:** Excel import "Section does not exist"
- **Solution:** Check section letter matches department config
- **Solution:** Verify department code is correct

**Issue:** Roles not displaying in table
- **Solution:** Ensure faculty data includes role fields
- **Solution:** Check API returns role fields (GET /faculty)

---

## 🎓 Role Definitions

### Class Advisor
- Responsible for a specific class (Year + Section)
- Example: Class Advisor for 2nd Year CSE Section A
- Format in Excel: `2 CSE A` (Year Department Section)
- Can be assigned to multiple classes
- Display in table: `2 A`, `3 B` etc.

### Innovation Coordinator
- Coordinates innovation/entrepreneurship activities
- Department-level responsibility
- Boolean flag (yes/no)
- Display in table: `Innovation Coordinator` label
- Can have this role independently or with Class Advisor role

---

## 📊 Status Summary

| Component | Status | Details |
|-----------|--------|---------|
| Database Model | ✅ Complete | Schema updated with role fields |
| API Endpoints | ✅ Complete | All CRUD operations support roles |
| Excel Import | ✅ Complete | Parses role columns correctly |
| Excel Template | ✅ Complete | Shows role columns with examples |
| Add Faculty UI | ✅ Complete | Role fields in dialog |
| Edit Faculty UI | ✅ Complete | Role fields in dialog |
| Table Display | ✅ Complete | Shows role data |
| Validation | ✅ Complete | Frontend and backend validation |

---

**Last Updated:** December 4, 2025  
**Version:** 1.0.0  
**Ready for:** Production Use ✅
