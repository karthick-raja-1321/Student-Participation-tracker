# Excel Upload 400 Error - Resolution Guide

## Issue
When uploading faculty or student data via Excel, getting error:
```
400 Validation failed
`faculty` is not a valid enum value for path `importType`.
`partial` is not a valid enum value for path `status`.
```

## Root Cause
The `ExcelImportLog` MongoDB model uses **uppercase** enum values:
```javascript
importType: {
  enum: ['STUDENTS', 'FACULTY', 'DEPARTMENTS', 'CLASS_MAPPING', 'MENTOR_MAPPING']
}
status: {
  enum: ['PROCESSING', 'COMPLETED', 'FAILED', 'PARTIAL']
}
```

But the Excel controller was saving with **lowercase** values:
```javascript
importType: 'faculty'    // Wrong - should be 'FACULTY'
status: 'partial'        // Wrong - should be 'PARTIAL'
```

## Solution Timeline

### ✅ Code Fix Applied (Commit b309a4f)
The controller was updated to use correct enum values:

```javascript
// BEFORE (Wrong)
await ExcelImportLog.create({
  importType: 'faculty',
  status: 'completed'
});

// AFTER (Correct)
await ExcelImportLog.create({
  importType: 'FACULTY',
  status: 'COMPLETED'
});
```

Changes made in both functions:
- `exportData.importStudents()` → uses `'STUDENTS'` and `'COMPLETED'`/`'PARTIAL'`
- `excelController.importFaculty()` → uses `'FACULTY'` and `'COMPLETED'`/`'PARTIAL'`

Also fixed field names to match schema:
- `successfulRows` → `successCount`
- `failedRows` → `failureCount`

### ⏳ Render Deployment Status
**Current Status:** Awaiting manual redeploy trigger

The code is committed and pushed to GitHub, but Render may require manual redeploy.

## How to Test Locally

The Excel upload works correctly in local development. To test:

```bash
cd server
node testExcelUpload.js
```

This script:
1. Logs in as admin (who has EXCEL_IMPORT permission)
2. Creates a test Excel file with faculty data
3. Uploads via `/api/excel/upload/faculty`
4. Displays success/failure response

## How to Deploy to Render

### Option 1: Manual Redeploy (Recommended)
1. Go to https://dashboard.render.com
2. Select "Student Participation Tracker" service
3. Click the "..." menu → "Manual Redeploy"
4. Wait for deployment to complete (2-3 minutes)
5. Test upload with the script above

### Option 2: Force GitHub Integration
Ensure webhook is active:
1. Go to Render Dashboard → Your Service → Settings
2. Under "Git Integration", verify it's connected to GitHub
3. Make a new commit to trigger redeploy:
   ```bash
   git commit --allow-empty -m "chore: trigger redeploy"
   git push origin master
   ```

## Files Modified

- **server/src/controllers/excel.controller.js**
  - Line 158: Fixed `importStudents()` ExcelImportLog creation
  - Line 333: Fixed `importFaculty()` ExcelImportLog creation

## Valid Enum Values (Reference)

**importType (must be uppercase):**
- `'STUDENTS'`
- `'FACULTY'`
- `'DEPARTMENTS'`
- `'CLASS_MAPPING'`
- `'MENTOR_MAPPING'`

**status (must be uppercase):**
- `'PROCESSING'`
- `'COMPLETED'`
- `'FAILED'`
- `'PARTIAL'`

**successCount & failureCount (field names):**
- Not `successfulRows` or `failedRows`

## Expected Response After Fix

**Success (200):**
```json
{
  "status": "success",
  "message": "Imported 1 of 1 faculty members",
  "data": {
    "total": 1,
    "successful": 1,
    "failed": 0,
    "errors": []
  }
}
```

**Validation Error (if not yet deployed):**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    "`faculty` is not a valid enum value for path `importType`.",
    "`partial` is not a valid enum value for path `status`."
  ]
}
```

## Next Steps

1. **Trigger Render Manual Redeploy** (see above)
2. **Wait 2-3 minutes** for deployment
3. **Test with:** `node testExcelUpload.js`
4. **Verify in UI:** Upload faculty/student Excel from https://secespt.netlify.app

## Troubleshooting

If still getting the error after manual redeploy:

1. **Check Render logs:**
   ```
   Render Dashboard → Service → Logs
   Look for "npm start" output
   ```

2. **Check deployment status:**
   ```
   Render Dashboard → Deploys
   Verify latest deployment shows "Live"
   ```

3. **Force clear cache:**
   - Go to Render → Settings → Environment
   - Add/remove a dummy variable to trigger rebuild
   - Redeploy

4. **Check MongoDB connection:**
   ```bash
   # Test from command line
   cd server
   node -e "
   const m = require('mongoose');
   m.connect(process.env.MONGODB_URI).then(() => {
     const schema = require('./src/models/ExcelImportLog');
     console.log('Schema enum:', schema.schema.paths.importType.enumValues);
   });
   "
   ```

---

**Last Updated:** December 21, 2025
**Fix Status:** ✅ Code Fixed | ⏳ Pending Render Deployment
