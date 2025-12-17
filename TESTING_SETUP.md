# Testing Setup - Faculty Approval Workflow

## Issues Fixed

### 1. ✓ Vite Port Configuration
- **Problem**: Vite was configured for port 5173 but running on 5713, causing WebSocket HMR failures
- **Solution**: Updated `vite.config.js` with:
  ```javascript
  server: {
    port: 5713,
    host: '0.0.0.0',
    hmr: {
      host: 'localhost',
      port: 5713,
      protocol: 'ws'
    }
  }
  ```

### 2. ✓ Faculty Permissions (403 Forbidden)
- **Problem**: faculty13@sece.ac.in was getting 403 because they didn't have `isMentor` or `isInnovationCoordinator` roles
- **Solution**: Updated faculty roles:
  - faculty13 (FAC2012): Added `isMentor=true` and `isInnovationCoordinator=true`
  - faculty2 (FAC2001): Added `isMentor=true`

### 3. ✓ Created Proper Submission for faculty2@sece.ac.in
- **Submission ID**: 693ac25c75b42d08994acd98
- **Mentor**: FAC2001 (faculty2@sece.ac.in)
- **Student**: CSE001 (student.cse1@sece.ac.in)
- **Current Stage**: MENTOR (waiting for mentor approval)

---

## How to Test

### Step 1: Restart the Frontend
Since you've updated the Vite config, stop the current frontend and restart it:

```powershell
# Kill the current frontend process if running
Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Where-Object {$_.Path -like '*client*'} | Stop-Process -Force

# Restart with the new config
cd "c:\Karthick\SECE\2025-2026\2025-2026 Even\Full Stack\Project\client"
npm run dev
```

### Step 2: Test faculty2@sece.ac.in
1. Go to: http://127.0.0.1:5713 (NOT localhost:5713)
2. Login with:
   - Email: `faculty2@sece.ac.in`
   - Password: `Password123`
3. Navigate to "Submissions" or "Approvals"
4. You should see the submission (ID: 693ac25c75b42d08994acd98)
5. Click to review and approve

### Step 3: Check Approval History
After faculty2 approves, the submission moves to CLASS ADVISOR (Faculty1):
- Email: `faculty1@sece.ac.in`
- Employee ID: FAC2000

---

## Submission Details for Reference

### Current Submission
```
Submission ID: 693ac25c75b42d08994acd98
Student: CSE001 (student.cse1@sece.ac.in)
Event: Agent.ai Challenge

Approval Chain:
1. MENTOR: faculty2@sece.ac.in (FAC2001) ← Currently here
2. CLASS ADVISOR: faculty1@sece.ac.in (FAC2000)
3. INNOVATION COORDINATOR: Not assigned
4. HOD: Not assigned
```

### Credentials for Testing

**Faculty Roles:**
- **Mentor (faculty2@sece.ac.in)**: FAC2001
  - Can approve/reject submissions
  - Currently has the submission in their queue

- **Class Advisor (faculty1@sece.ac.in)**: FAC2000
  - Will receive the submission after mentor approves

- **Innovation Coordinator (faculty13@sece.ac.in)**: FAC2012
  - Now has permissions to view submissions
  - Currently no submissions assigned

---

## Common Issues & Solutions

### Still Seeing "Failed to load resource: ERR_CONNECTION_REFUSED"
- Clear browser cache: Ctrl+Shift+Del
- Use `http://127.0.0.1:5713` instead of `localhost:5713`
- Try in an incognito window

### 403 Forbidden Still Appearing
- Make sure you're using the updated faculty roles
- Log out and log back in to refresh permissions
- Check browser console (F12) for specific error messages

### WebSocket Connection Failed
- The new Vite config should fix this
- Restart the frontend dev server
- Check that port 5713 is not blocked by firewall

---

## Next Steps

1. Test faculty2@sece.ac.in login and submission approval
2. Test the complete approval chain
3. Create submissions with other mentors as needed
4. Assign Innovation Coordinator and HOD to submissions when required
