# Student Participation Tracking System

A comprehensive MERN stack application for tracking student participation in various events across an institution.

## 📋 Features

### Core Features (✅ Complete)
- **Multi-role Access Control**: Super Admin, HoD, Faculty, Student
- **Two-Phase Submission Workflow**: Before and after event participation
- **Event Management**: Create, edit, delete events with role-based controls
- **Real-time Dashboard**: Live statistics and data for all user roles
- **Submission Tracking**: View, search, filter, and manage submissions
- **On-Duty Approval System**: Automatic balance reduction with HoD approval
- **Advanced Analytics**: Department-wise and institution-wide reports

### Advanced Features (Ready for Integration)
- **Automated WhatsApp Reminders**: Using Twilio API for overdue submissions
- **Excel Import/Export**: Bulk data operations with validation
- **File Management**: Secure file upload with AWS S3/Cloudinary
- **Real-time Notifications**: In-app notification system

## 🚀 Tech Stack

### Backend
- Node.js 18+
- Express.js 4.18+
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- Twilio for WhatsApp
- ExcelJS for Excel operations
- Winston for logging
- Node-Cron for scheduled tasks

### Frontend
- React 18.2+
- Redux Toolkit for state management
- Material-UI (MUI) 5.x
- React Router v6
- Axios for API calls
- Formik + Yup for forms
- Chart.js for data visualization
- React-Toastify for notifications

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- MongoDB installed and running
- Git installed

### Backend Setup

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student-participation-tracker
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CLIENT_URL=http://localhost:5173
ENABLE_CRON_JOBS=true
```

#### Client (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## 📱 Running the Application

1. Start MongoDB:
   ```bash
   mongod
   ```

2. Start backend server:
   ```bash
   cd server
   npm start
   # Backend runs on http://localhost:5000
   ```

3. Start frontend (in another terminal):
   ```bash
   cd client
   npm run dev
   # Frontend runs on http://localhost:5173 (or 5174 if 5173 is busy)
   ```

4. Access the application at `http://localhost:5173` (or `http://localhost:5174`)

### Test Credentials

**Admin/HOD Login:**
- Email: `admin@sece.ac.in` or `hod.cse@sece.ac.in`
- Password: `Password123`

**Student Login:**
- Email: `student@sece.ac.in`
- Password: `Password123`

### Important Notes
- Always run `npm install` in both `client` and `server` directories first
- MongoDB must be running on `localhost:27017`
- Both servers must be running simultaneously
- If port 5173 is busy, Vite will automatically use 5174
- CORS is configured to accept both ports

## 🗂️ Project Structure

```
project/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Redux store
│   │   ├── utils/         # Utilities
│   │   └── routes/        # Route configuration
│   └── package.json
│
├── server/                # Node.js backend
│   ├── src/
│   │   ├── config/       # Configuration files
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Custom middleware
│   │   ├── models/       # Mongoose models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── validators/   # Input validation
│   └── package.json
│
└── documentation/         # System documentation
```

## 👥 Default Roles

1. **SUPER_ADMIN** - Full system access
2. **HOD** - Department-level management
3. **FACULTY** - Student monitoring and approvals
4. **STUDENT** - Event registration and submissions

## 📊 API Documentation

The API follows RESTful conventions. Main endpoints:

- `/api/auth` - Authentication & login
- `/api/events` - Event management (CRUD with soft-delete)
- `/api/submissions/phase-i` - Phase I submissions with view/edit/delete
- `/api/submissions/phase-ii` - Phase II submissions with view/edit/delete
- `/api/submissions/on-duty/pending` - On-duty approval workflow
- `/api/approvals` - Approval workflow management
- `/api/reports` - Analytics and reports
- `/api/excel` - Excel import/export
- `/api/dashboard/stats` - Real-time dashboard statistics

### Recent API Additions (December 2025)

**Submission Management:**
- `PUT /api/submissions/phase-i/:id` - Update Phase I submission
- `DELETE /api/submissions/phase-i/:id` - Delete Phase I submission
- `PUT /api/submissions/phase-ii/:id` - Update Phase II submission
- `DELETE /api/submissions/phase-ii/:id` - Delete Phase II submission

**On-Duty Approval:**
- `GET /api/submissions/on-duty/pending` - Get pending on-duty submissions
- `POST /api/submissions/:id/on-duty/approve` - Approve with balance reduction
- `POST /api/submissions/:id/on-duty/reject` - Reject on-duty submission

See full API specification in the `05_REST_API_Specification.md` file.

## 🔐 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcryptjs
- Input validation with Joi
- File upload validation
- CORS configuration
- Helmet.js security headers

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Development Team

Developed as part of Full Stack Development course, SECE 2025-2026.

## 🐛 Known Issues

This is a development version. Production deployment requires:
- Environment variable configuration
- MongoDB Atlas setup
- AWS S3 or Cloudinary configuration
- Twilio WhatsApp API setup
- SSL certificates
- Production build optimization

## 📞 Support

For issues and questions, please create an issue in the repository.

## 📁 Deployment & Environment (Cloud + Local)

Required environment variables (server):
- `MONGODB_URI` — MongoDB Atlas connection string (required). Example:
   mongodb+srv://user:password@cluster0.abcd.mongodb.net/student-participation-tracker?retryWrites=true&w=majority
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — secrets for JWT tokens.
- `CLIENT_URL` — frontend origin for OAuth/CORS (optional).
- `FRONTEND_ORIGINS` — comma-separated allowed origins for CORS (e.g. `https://spt-client.onrender.com,https://your-vercel-app.vercel.app,http://localhost:5173`). When empty, CORS remains permissive for development.

Client environment variables:
- `VITE_API_BASE` (or `VITE_API_URL`) — base URL for API calls, e.g. `https://spt-server.onrender.com/api` or `http://localhost:5000/api` for local.

Quick values for common hosts:
- Render (backend): set secret `MONGODB_URI` and env `FRONTEND_ORIGINS` to include deployed frontend URLs and `http://localhost:5173`.
- Vercel (frontend): set `VITE_API_BASE` to your Render backend URL.

Local development checklist:
- Install Node.js 18+.
- Install project dependencies in both `server` and `client` (`npm install`).
- Ensure `MONGODB_URI` is set in `server/.env` (you can use Atlas URI or `mongodb://localhost:27017/student-participation-tracker`).
- Start backend: `cd server && npm run dev`.
- Start frontend: `cd client && npm run dev`.

Cloud hosting checklist:
- Backend (Render recommended):
   - Create a Web Service connected to this repo branch.
   - Add a secret `MONGODB_URI` (Atlas URI) in Render and add it as an environment variable to the service.
   - Add `FRONTEND_ORIGINS` env var with allowed frontend origins.
   - Build command: `cd server && npm ci`; Start command: `cd server && npm start`.
- Frontend (Vercel or Cloudflare Pages recommended):
   - Vercel: set Root Directory to `client`, Build Command `npm run build`, Output `dist`.
   - Add `VITE_API_BASE` env var pointing to the Render backend API.

Security notes:
- Never commit `.env` to source control. Use host-provided secrets.
- Restrict `FRONTEND_ORIGINS` to your known domains in production.
- Rotate DB credentials if accidentally leaked.

If you want, I can add a small `DEPLOY.md` with step-by-step GUI instructions for Render and Vercel.
