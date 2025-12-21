# Student Participation Tracker - Troubleshooting Guide & FAQs

## Table of Contents
1. [Common Errors & Solutions](#common-errors--solutions)
2. [Authentication Issues](#authentication-issues)
3. [Access Control Issues](#access-control-issues)
4. [Deployment Issues](#deployment-issues)
5. [Frequently Asked Questions](#frequently-asked-questions)
6. [Valid Login Credentials](#valid-login-credentials)
7. [Database Audit & Verification](#database-audit--verification)

---

## Common Errors & Solutions

### Error 1: "Email or Password Invalid"

**Symptom:** Login page shows "Email or password invalid" error.

**Root Causes:**
1. User email doesn't exist in the database
2. Password is incorrect (should be `Password123` for all seeded users)
3. User account is inactive (`isActive: false`)

**Solutions:**
- Check if your email is in the [Valid Login Credentials](#valid-login-credentials) section
- If using a custom email, create a new user via signup or manual database insertion
- Verify user is active in the database: `db.users.findOne({ email: "your@email.com" })`

**Prevention:**
- Always use credentials from the seeded list
- For new custom users, use the frontend signup form or create via database script

---

### Error 2: "500 Internal Server Error" on Login

**Symptom:** Login returns HTTP 500 error.

**Root Causes:**
1. JWT_SECRET environment variable not set on Render
2. JWT_REFRESH_SECRET environment variable not set
3. MONGODB_URI not configured
4. Database connection failing

**Solutions:**
- **For Render deployment:**
  1. Go to Render Dashboard → Your Service → Environment
  2. Add the following variables:
     ```
     MONGODB_URI=mongodb+srv://karthickrajam:Raja%2E1138@raja-cluster.149qzyk.mongodb.net/student-participation-tracker
     JWT_SECRET=your_secret_key_here
     JWT_REFRESH_SECRET=your_refresh_secret_here
     NODE_ENV=production
     ```
  3. Redeploy the service
  4. Verify deployment with: `curl https://student-participation-tracker.onrender.com/health`

- **For local development:**
  - Ensure `.env` file has all required variables
  - Check `.env.example` for the template

---

### Error 3: "404 Not Found" on Root Endpoint

**Symptom:** Accessing `https://student-participation-tracker.onrender.com/` returns 404.

**Root Cause:**
The Express server doesn't have a route handler for the root path `/`.

**Solution:**
Add this route to [server/src/index.js](server/src/index.js):
```javascript
app.get('/', (req, res) => {
  res.json({ status: 'success', message: 'Student Participation Tracker API is running' });
});
```

**Status:** ✅ FIXED in current deployment.

---

### Error 4: "403 Forbidden" on Submission Endpoints

**Symptom:** Faculty or mentor trying to access `/api/submissions/phase-i` or `/api/submissions/phase-ii` gets 403.

**Root Cause:**
Faculty user lacks required role flags:
- `isClassAdvisor = false`
- `isMentor = false`
- `isInnovationCoordinator = false`

The system requires at least ONE of these flags to be `true` for faculty to access submissions.

**Solution:**
1. **Option A:** Run the fix script (one-time):
   ```bash
   cd server
   node fixFacultyRoles.js
   ```
   This assigns:
   - All faculty: `isMentor = true`
   - First faculty per department: `isClassAdvisor = true`
   - CSE's first faculty: `isInnovationCoordinator = true`

2. **Option B:** Manual database update:
   ```javascript
   db.faculties.updateOne(
     { userId: ObjectId("faculty_user_id") },
     { $set: { isMentor: true } }
   );
   ```

**Status:** ✅ FIXED - All 16 faculty now have proper roles.

---

### Error 5: "Localhost Called from Production"

**Symptom:** Frontend on Netlify shows CORS errors or fails to load data because it's calling `localhost:5000`.

**Root Cause:**
Environment variable `VITE_API_URL=http://localhost:5000` is being used in production.

**Solution:**
Update [client/src/utils/api.js](client/src/utils/api.js) to ignore localhost URLs when running on production domain:

```javascript
const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const currentUrl = window.location.hostname;
  
  // If running on production domain, ignore localhost in env
  if (currentUrl !== 'localhost' && currentUrl !== '127.0.0.1') {
    return 'https://student-participation-tracker.onrender.com/api';
  }
  
  // Use env URL if it's valid (not localhost in production)
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  
  // Default fallback
  return 'https://student-participation-tracker.onrender.com/api';
};
```

**Status:** ✅ FIXED in current deployment.

---

### Error 6: "User Not Found in Database"

**Symptom:** Manual user creation shows email like `anandaraj.a@sece.ac.in` doesn't exist initially.

**Root Cause:**
New users must be created in the `users`, `faculties` (if faculty), or `students` (if student) collections.

**Solution:**
Use the dedicated user creation script or manually insert via database:

```javascript
// Create User
const user = await User.create({
  email: 'anandaraj.a@sece.ac.in',
  password: 'Password123',
  role: 'FACULTY',
  firstName: 'Anandaraj',
  lastName: 'A',
  phone: '9876543210',
  departmentId: cseId,
  isActive: true
});

// Create Faculty record
const faculty = await Faculty.create({
  userId: user._id,
  departmentId: cseId,
  employeeId: 'ANAND001',
  isMentor: true,
  isClassAdvisor: true,
  isInnovationCoordinator: true
});
```

---

## Authentication Issues

### Issue: JWT Token Expires Too Quickly

**Current Configuration:**
- Access Token: 24 hours
- Refresh Token: 7 days

**If you need to change:**
Edit [server/src/controllers/auth.controller.js](server/src/controllers/auth.controller.js):
```javascript
const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
```

---

### Issue: CORS Errors When Calling API

**Symptom:** Browser console shows CORS error: "Access to XMLHttpRequest blocked by CORS policy".

**Root Causes:**
1. Frontend and backend on different origins
2. CORS middleware not configured correctly
3. Credentials not being sent

**Solutions:**

1. **Check CORS configuration** in [server/src/index.js](server/src/index.js):
   ```javascript
   app.use(cors({
     origin: ['https://secespt.netlify.app', 'http://localhost:3000', 'http://localhost:5173'],
     credentials: true,
     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization']
   }));
   ```

2. **Ensure frontend includes credentials:**
   ```javascript
   // In api.js
   axiosInstance.defaults.withCredentials = true;
   ```

3. **For OPTIONS preflight requests:**
   Ensure the CORS middleware runs before route handlers.

---

## Access Control Issues

### Issue: Student Can See Other Students' Submissions

**Root Cause:**
Permission check in submission retrieval not filtering by student ID.

**Solution:**
Verify [server/src/controllers/phaseI.controller.js](server/src/controllers/phaseI.controller.js) has proper filtering:

```javascript
if (user.role === 'STUDENT') {
  // Students can only see their own submissions
  submissions = await PhaseISubmission.find({ studentId: user._id });
} else if (user.role === 'FACULTY') {
  // Faculty can see submissions from students they mentor
  // ... mentor check here ...
}
```

---

### Issue: HOD Cannot See Department Students

**Root Cause:**
Missing department filter in HOD submission retrieval.

**Solution:**
Ensure HOD filter includes department ID:

```javascript
if (user.role === 'HOD') {
  submissions = await PhaseISubmission.find({
    $lookup: {
      from: 'students',
      let: { studentId: '$studentId' },
      pipeline: [
        { $match: { $expr: { $eq: ['$_id', '$$studentId'] } } },
        { $match: { departmentId: user.departmentId } }
      ],
      as: 'student'
    }
  });
}
```

---

## Deployment Issues

### Issue: Netlify Build Failing

**Symptom:** Deployment shows build error on Netlify.

**Solution:**
1. Check Netlify deploy logs
2. Verify `client/package.json` has build script:
   ```json
   "scripts": {
     "build": "vite build"
   }
   ```
3. Ensure all dependencies are installed
4. Check for TypeScript/ESLint errors

**Deployment Commands:**
```bash
# From project root
netlify deploy --prod
```

---

### Issue: Render Service Won't Start

**Symptom:** Render shows "Service is initializing..." but never starts.

**Solutions:**
1. **Check logs:**
   ```bash
   railway logs -f
   ```

2. **Verify env variables are set:** All of:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `NODE_ENV=production`

3. **Test locally first:**
   ```bash
   cd server
   npm install
   npm start
   ```

4. **Check for startup errors:**
   - Port conflicts (should use `process.env.PORT || 5000`)
   - Missing dependencies
   - Database connection timeouts

---

## Frequently Asked Questions

### Q1: What are the valid test credentials?

**A:** See [Valid Login Credentials](#valid-login-credentials) section below. All passwords are `Password123`.

---

### Q2: How do I create a new user?

**A:** Two options:

**Option 1: Frontend Signup** (if enabled)
- Navigate to signup page
- Enter email, password, and role
- Account will be created immediately

**Option 2: Database Script**
Create a script like:
```javascript
const User = require('./src/models/User');
const Faculty = require('./src/models/Faculty');

const createNewFaculty = async () => {
  const user = await User.create({
    email: 'newemail@sece.ac.in',
    password: 'Password123',
    role: 'FACULTY',
    firstName: 'New',
    lastName: 'Faculty',
    departmentId: cseId,
    isActive: true
  });
  
  await Faculty.create({
    userId: user._id,
    departmentId: cseId,
    employeeId: 'NEW001',
    isMentor: true
  });
};
```

---

### Q3: Why can't a faculty member see submissions?

**A:** Faculty must have at least one of these flags `true`:
- `isClassAdvisor`
- `isMentor`
- `isInnovationCoordinator`

Run the fix script:
```bash
node server/fixFacultyRoles.js
```

---

### Q4: How do I reset all data to seed state?

**A:** 

**Option 1: Drop and Re-seed (Fastest)**
```bash
cd server
node src/scripts/seedData.js
```
This clears all data and recreates the original 222 users.

**Option 2: Restore from Backup**
```bash
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/student-participation-tracker" ./dump_spt
```

---

### Q5: Where are the frontend and backend deployed?

**A:**
- **Frontend:** https://secespt.netlify.app (React/Vite on Netlify)
- **Backend:** https://student-participation-tracker.onrender.com (Node.js/Express on Render)
- **Database:** MongoDB Atlas (cloud-hosted)

---

### Q6: How do I check if the API is working?

**A:** Use these health check commands:

```bash
# Check backend status
curl https://student-participation-tracker.onrender.com/health

# Test login
curl -X POST https://student-participation-tracker.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sece.ac.in","password":"Password123"}'

# Test student list (requires auth token from login above)
curl https://student-participation-tracker.onrender.com/api/students \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

### Q7: Can I change the password for a user?

**A:** Yes, two methods:

**Method 1: User Can Change Own Password**
Via frontend settings page (if implemented).

**Method 2: Admin Can Reset**
```javascript
const user = await User.findOne({ email: 'user@sece.ac.in' });
user.password = 'NewPassword123';
await user.save();
```

---

### Q8: How do I verify all users are in the database?

**A:** Run the audit script:
```bash
cd server
node auditDb.js
```

Expected output:
```
Total Users: 222
- Admins: 1
- HODs: 5
- Faculty: 16
- Students: 200
```

---

### Q9: What if the database connection fails?

**A:** Check these:

1. **Verify MongoDB Atlas is accessible:**
   ```bash
   mongosh "mongodb+srv://karthickrajam:Raja%2E1138@raja-cluster.149qzyk.mongodb.net/student-participation-tracker"
   ```

2. **Check IP whitelist in MongoDB Atlas:**
   - Go to MongoDB Atlas Console
   - Network Access → IP Whitelist
   - Ensure Render's IP is whitelisted (or use 0.0.0.0/0 for any IP)

3. **Verify MONGODB_URI in env:**
   ```
   mongodb+srv://user:password@cluster.mongodb.net/database-name
   ```

---

### Q10: How do I deploy changes to production?

**A:** 

**For Frontend:**
```bash
# Commit changes
git add client/
git commit -m "Your message"

# Deploy to Netlify
cd client
netlify deploy --prod
```

**For Backend:**
```bash
# Commit changes
git add server/
git commit -m "Your message"

# Push to Render (auto-deploys) or use Railway
git push origin main
```

---

## Valid Login Credentials

All passwords: **`Password123`**

### Super Admin
| Email | Role |
|-------|------|
| admin@sece.ac.in | SUPER_ADMIN |

### HODs (One per Department)
| Email | Department |
|-------|------------|
| hod.cse@sece.ac.in | CSE |
| hod.ece@sece.ac.in | ECE |
| hod.eee@sece.ac.in | EEE |
| hod.mech@sece.ac.in | MECH |
| hod.civil@sece.ac.in | CIVIL |

### Faculty (16 Total)
| Email | Count |
|-------|-------|
| faculty1@sece.ac.in - faculty15@sece.ac.in | 15 |
| anandaraj.a@sece.ac.in | 1 |

**Faculty Roles (after fix):**
- All: `isMentor = true`
- faculty1@sece.ac.in (CSE): Also `isClassAdvisor = true`, `isInnovationCoordinator = true`
- Others: Additional roles based on department and seniority

### Students (200 Total)
**Pattern:** `[year][dept][section][number]@student.sece.ac.in`

**Example Credentials:**
```
22csea001@student.sece.ac.in  (2022, CSE, Section A, Roll 001)
23eceb005@student.sece.ac.in  (2023, ECE, Section B, Roll 005)
24mecha002@student.sece.ac.in (2024, MECH, Section A, Roll 002)
```

**Full Coverage:**
- Years: 21, 22, 23, 24, 25
- Departments: cse, ece, eee, mech, civil
- Sections: a, b
- Numbers: 001-005

---

## Database Audit & Verification

### How to Verify Database Status

**Run comprehensive audit:**
```bash
cd server
node auditDb.js
```

**Check specific users:**
```bash
node auditLoginUsers.js
```

**Test all logins:**
```bash
node testAllUsers.js
```

### Expected Results

**Total Users:**
- 1 Super Admin ✓
- 5 HODs ✓
- 16 Faculty (all with at least `isMentor = true`) ✓
- 200 Students ✓

**All Faculty Roles:**
- Faculty 1-3 (CSE): Mentor + ClassAdvisor + IC
- Faculty 4-6 (ECE): Mentor + ClassAdvisor
- Faculty 7-9 (EEE): Mentor + ClassAdvisor
- Faculty 10-12 (MECH): Mentor + ClassAdvisor
- Faculty 13-15 (CIVIL): Mentor + ClassAdvisor
- anandaraj.a@sece.ac.in (CSE): Mentor + IC

---

## Troubleshooting Checklist

- [ ] User exists in database (`auditDb.js`)
- [ ] User is active (`isActive: true`)
- [ ] Password is correct (`Password123` for seeded users)
- [ ] Faculty has roles assigned (if faculty role)
- [ ] Backend is running and healthy (`/health` endpoint)
- [ ] Frontend can reach backend (check browser console)
- [ ] Environment variables are set on Render/Railway
- [ ] MongoDB Atlas whitelist includes your IP
- [ ] JWT secrets are configured
- [ ] Latest code is deployed

---

## Support & Further Help

If issues persist after consulting this guide:

1. **Check logs:**
   - Frontend: Browser Developer Tools (F12)
   - Backend: Render/Railway logs
   - Database: MongoDB Atlas logs

2. **Collect diagnostic info:**
   ```bash
   # Show backend status
   curl https://student-participation-tracker.onrender.com/health
   
   # Show database user count
   node server/auditDb.js
   
   # Test specific login
   node server/testLogins.js
   ```

3. **Review recent commits:**
   ```bash
   git log --oneline -10
   ```

---

**Last Updated:** December 21, 2025
**Status:** All known issues resolved ✅
