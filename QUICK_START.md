# Quick Start Guide

## ⚡ 5-Minute Quick Setup

### Prerequisites
- ✅ Node.js 18+ installed
- ✅ MongoDB running on localhost:27017
- ✅ Git (optional)

### Start Backend (Terminal 1)
```bash
cd server
npm start
# ✅ Backend runs on http://localhost:5000
```

### Start Frontend (Terminal 2)
```bash
cd client
npm run dev
# ✅ Frontend runs on http://localhost:5173 or 5174
```

### Login & Access
Go to: **http://localhost:5173**

Use these credentials:

**As Admin/HOD:**
```
Email: admin@sece.ac.in
Password: Password123
```

**As Student:**
```
Email: student@sece.ac.in
Password: Password123
```

**As Faculty:**
```
Email: faculty@sece.ac.in
Password: Password123
```

---

## Step-by-Step Setup (Detailed)

### 1. Verify MongoDB is Running

**Windows:**
```bash
# Check if MongoDB is running
mongosh
# If connected successfully, close with: exit
```

If not running, start it:
```bash
# Windows: Start MongoDB service or run mongod.exe
mongod
```

### 2. Start Backend Server

```bash
# Terminal 1
cd server

# Install dependencies (if first time)
npm install

# Start server
npm start

# Expected Output:
# ✓ Server running on port 5000
# ✓ MongoDB Connected
# ✓ All routes registered
```

### 3. Start Frontend Application

```bash
# Terminal 2
cd client

# Install dependencies (if first time)
npm install

# Start development server
npm run dev

# Expected Output:
# ✓ VITE v5.x.x ready in xxx ms
# ✓ Local: http://localhost:5173/
# ✓ (Port 5174 if 5173 is busy)
```

### 4. Open in Browser

```
URL: http://localhost:5173
or: http://localhost:5174 (if 5173 busy)
```

### 5. Login with Test Credentials

**Option 1: Admin Dashboard**
```
Email: admin@sece.ac.in
Password: Password123
```
- View system-wide statistics
- Manage events
- View/filter submissions
- Approve on-duty requests

**Option 2: Student Dashboard**
```
Email: student@sece.ac.in
Password: Password123
```
- View your events
- View your submissions
- See on-duty balance
- Register for events

**Option 3: Faculty Dashboard**
```
Email: faculty@sece.ac.in
Password: Password123
```
- Create/edit/delete events
- Manage submissions
- Approve on-duty requests (if coordinator)

## ❌ Troubleshooting

### "Network Error" or Can't Connect
**Problem:** Frontend shows network error  
**Solution:**
1. ✅ Verify both servers are running
2. ✅ Check backend is on port 5000
3. ✅ Check frontend is on port 5173/5174
4. ✅ Clear browser cache (Ctrl+Shift+Delete)
5. ✅ Hard refresh page (Ctrl+Shift+R)

### "Cannot GET /" 
**Problem:** Page shows "Cannot GET" error  
**Solution:**
1. ✅ Make sure you're accessing port 5173, not 5000
2. ✅ Try hard refresh (Ctrl+Shift+R)
3. ✅ Check if React app loaded in console (F12)

### "Duplicate Schema Index" Warnings
**Problem:** Server shows duplicate index warnings  
**Solution:**  
✅ **This is normal and safe** - No impact on functionality

### MongoDB Connection Error
**Problem:** Backend shows MongoDB connection error  
**Solution:**
1. ✅ Start MongoDB: `mongod`
2. ✅ Or use MongoDB service (Windows)
3. ✅ Verify connection: `mongosh`
4. ✅ Check .env: `mongodb://localhost:27017/student-participation-tracker`

### Port 5173 Already in Use
**Problem:** "Port 5173 is in use"  
**Solution:**  
✅ **Vite auto-switches to 5174** - Just use that port instead

### Dependencies Not Installed
```bash
# Reinstall dependencies
cd server && npm install && npm start
# Terminal 2:
cd client && npm install && npm run dev
```

---

## 📊 What You Can Do

### As Admin/HOD

✅ **Dashboard**
- View system statistics
- See total events, submissions, pending approvals

✅ **Event Management**
- Create new events
- Edit event details
- Delete events
- View event details

✅ **Submission Management**
- View all Phase I and Phase II submissions
- Search submissions by event name
- Filter by status (All, Draft, Submitted, Under Review, Approved, Rejected)
- Edit submission details
- Delete submissions with confirmation
- View submission details

✅ **On-Duty Approvals** ⭐ New
- View pending on-duty submissions
- See student on-duty balance (X/7)
- Approve submission (auto-reduces balance)
- Reject submission (allows resubmission)

✅ **Reports**
- View analytics and reports
- Department-wise statistics

### As Student

✅ **Dashboard**
- View "My Events" (registered events)
- View "My Submissions" (Phase I & II)
- See "Approved" count
- See "Prizes Won"
- See "On-Duty Balance" (X/7)

✅ **Event Management**
- View all events
- View event details
- Register for events
- Cannot edit or delete events

✅ **Submissions**
- View your Phase I and Phase II submissions
- Cannot edit or delete submissions

### As Faculty

✅ All Admin features except global analytics

---

## 🎯 Key Features Working Right Now

| Feature | Status | How to Test |
|---------|--------|-----------|
| Login | ✅ | Use credentials above |
| Dashboard | ✅ | Login → See statistics |
| Events View | ✅ | Navigate to Events page |
| Create Event | ✅ | Click "New Event" button |
| Edit Event | ✅ | Click event row → Edit button |
| Delete Event | ✅ | Click event row → Delete button |
| View Submissions | ✅ | Navigate to Submissions |
| Search Submissions | ✅ | Type in search box |
| Filter Submissions | ✅ | Use status dropdown |
| Edit Submission | ✅ | Click edit icon |
| Delete Submission | ✅ | Click delete icon |
| On-Duty Approval | ✅ | Navigate to Approvals |
| Balance Tracking | ✅ | Check on-duty balance |

---

## 📚 Documentation Files

For more detailed information, check:

- **CURRENT_STATUS.md** - Complete project status (this session)
- **README.md** - Project overview
- **05_REST_API_Specification.md** - All API endpoints
- **DASHBOARD_AND_TRACKING_FEATURES.md** - Feature details
- **IMPLEMENTATION_CHECKLIST.md** - Progress tracking
- **ON_DUTY_QUICK_REFERENCE.md** - On-duty API reference

---

## 🔧 Environment Variables

If needed, edit `.env` files:

**Server (.env):**
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student-participation-tracker
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:5173
```

**Client (.env):**
```
VITE_API_URL=http://localhost:5000/api
```

---

## ⚡ Quick Commands Reference

```bash
# Start Backend (Port 5000)
cd server && npm start

# Start Frontend (Port 5173/5174)
cd client && npm run dev

# Check MongoDB
mongosh

# Kill Node processes (if stuck)
Get-Process -Name node | Stop-Process -Force

# Clear npm cache
npm cache clean --force

# Reinstall all dependencies
cd server && rm -rf node_modules && npm install
cd ../client && rm -rf node_modules && npm install
```

---

## 🎓 Learning Resources

### Backend API Testing
- Use Postman or Thunder Client
- Base URL: `http://localhost:5000/api`
- Include JWT token in Authorization header

### Frontend Debugging
- Press F12 to open developer tools
- Check Console tab for errors
- Check Network tab for API calls
- Use Redux DevTools (installed) to see state

### Database Exploration
- Use MongoDB Compass GUI
- Or use `mongosh` CLI tool
- Database: `student-participation-tracker`

---

## ✨ Next Steps

1. ✅ **Explore Dashboard** - See live statistics
2. ✅ **Create Event** - Add a test event
3. ✅ **View Submissions** - Search and filter
4. ✅ **Test On-Duty** - Approve a submission (balance reduces)
5. ✅ **Try Different Roles** - Login as different users
6. ✅ **Test Error Cases** - See error handling in action

---

## 💡 Tips & Tricks

✅ Both servers must be running simultaneously  
✅ If port 5173 busy, Vite automatically uses 5174  
✅ Hard refresh page (Ctrl+Shift+R) clears cache  
✅ Check browser console (F12) for errors  
✅ MongoDB must be running for backend to work  
✅ Student role has read-only access by design  
✅ On-duty balance = 7 - availed (auto-calculated)  

---

## 🆘 Still Having Issues?

1. **Check all servers running:**
   ```bash
   Get-Process -Name node
   mongosh
   ```

2. **Check console output** for error messages

3. **Review documentation** for detailed explanations

4. **Try restarting** all servers (clean start)

5. **Reinstall dependencies** if very stuck

---

**Status:** ✅ Everything is ready to use!  
**Last Updated:** December 4, 2025  
**Support:** Check CURRENT_STATUS.md for full project details
