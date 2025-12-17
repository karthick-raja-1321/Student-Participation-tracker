# Quick Reference: Innovation Coordinator Approval System

## What Changed?

**All "Mentor Approvals" are now called "Innovation Coordinator Approvals"**

## User-Facing Changes

### Frontend
- **Tab Name:** "Mentor Approvals" → "Innovation Coordinator Approvals"
- **Table Column:** "Mentor" → "Innovation Coordinator"  
- **API Endpoint:** `/mentor-approval` → `/innovation-coordinator-approval`

### For Faculty2 (Innovation Coordinator)
When you log in as **faculty2@sece.ac.in**:

1. Click on **Approvals** in the menu
2. Click on **"Innovation Coordinator Approvals"** tab (this was "Mentor Approvals" before)
3. You'll see submissions that Faculty1 (Advisor) has already approved
4. Review and approve them with your comments

---

## The Approval Workflow (Unchanged Logic)

```
Step 1: Faculty1 (Class Advisor) Approves
        ↓
Step 2: Faculty2 (Innovation Coordinator) Approves ← Now called "Innovation Coordinator"
        ↓
Step 3: HOD (Head of Department) Approves & Sets Status
        ↓
Final Status: APPROVED
```

---

## Testing the System

### 1️⃣ Login as Class Advisor (Faculty1)
- Email: `faculty1@sece.ac.in`
- Password: `password123`
- Approve some submissions in the **"Advisor Approvals"** tab

### 2️⃣ Login as Innovation Coordinator (Faculty2)
- Email: `faculty2@sece.ac.in`
- Password: `password123`
- Go to **"Innovation Coordinator Approvals"** tab (previously "Mentor Approvals")
- **You should now see** the submissions Faculty1 just approved ✅
- Approve them in this tab

### 3️⃣ Login as HOD
- Email: `hod.cse@sece.ac.in`
- Password: `password123`
- Go to **"HOD Approvals"** tab
- You should see submissions both Advisor and Innovation Coordinator approved
- Approve to complete the workflow

### 4️⃣ Login as Student
- Email: `22csea001@student.sece.ac.in`
- Password: `password123`
- Go to **Submissions**
- View the submission to see the complete approval timeline from all three levels

---

## Database

**No database changes needed!**

The system uses the existing `mentorApproval` field but displays it as "Innovation Coordinator Approval" in the UI. Everything flows correctly through the database.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Faculty2 doesn't see submissions after Faculty1 approves | Refresh the page or switch tabs and come back |
| "You are not the innovation coordinator for this student" error | Make sure you're logged in as the correct faculty member |
| Approvals tab is empty | Make sure the previous approval level has already approved |
| Changes not reflecting | Restart the server: `npm start` in the server directory |

---

## Key Points

✅ **Faculty1's approval is automatically saved** in the database after they approve  
✅ **Faculty2 can see Faculty1's approval** when they go to Innovation Coordinator Approvals tab  
✅ **Sequential enforcement** - Faculty2 can only approve after Faculty1 approves  
✅ **Comments are stored** at each approval level  
✅ **Full timeline** is visible to the student after all approvals complete  

---

**Status:** ✅ Live and Working  
**Last Updated:** December 5, 2025
