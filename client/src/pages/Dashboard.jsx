import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Grid, Paper, Typography, Box, CircularProgress, Button, Card, CardContent, IconButton, Tooltip } from '@mui/material';
import { 
  Event, Assignment, CheckCircle, EmojiEvents, 
  People, School, Pending, Assessment, Refresh, TrendingUp, Settings, NotificationsActive, Brightness4, Brightness7
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { ColorModeContext } from '../App';
import api from '../utils/api';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  const [eventFilter, setEventFilter] = useState('all'); // Filter for HOD dashboard
  const [eventCategoryFilter, setEventCategoryFilter] = useState('all'); // Event type filter (workshop, hackathon, seminar)
  const [performerSectionFilter, setPerformerSectionFilter] = useState('all'); // Section filter for performers
  const [performerYearFilter, setPerformerYearFilter] = useState('all'); // Year filter for performers
  const [deptSectionFilter, setDeptSectionFilter] = useState('all'); // Department section filter
  const [deptYearFilter, setDeptYearFilter] = useState('all'); // Department year filter

  // Build dynamic list of event types (from data)
  const eventTypesFromData = useMemo(() => {
    const types = new Set();
    (dashboardData?.rawData?.events || []).forEach(e => {
      const t = (e?.eventType || '').toString().trim().toLowerCase();
      if (t) types.add(t);
    });
    (dashboardData?.rawData?.submissions || []).forEach(s => {
      const t = (s?.eventId?.eventType || '').toString().trim().toLowerCase();
      if (t) types.add(t);
    });
    (dashboardData?.rawData?.registrations || []).forEach(r => {
      const t = (r?.eventId?.eventType || '').toString().trim().toLowerCase();
      if (t) types.add(t);
    });
    return Array.from(types);
  }, [dashboardData?.rawData?.events, dashboardData?.rawData?.submissions, dashboardData?.rawData?.registrations]);

  const allEventTypes = useMemo(() => {
    return ['all', ...eventTypesFromData];
  }, [eventTypesFromData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (user?.studentId) {
        // Fetch student-specific data
        const response = await api.get(`/students/dashboard/${user.studentId}`);
        if (response.data.status === 'success') {
          setDashboardData(response.data.data);
        }
      } else {
        // Fetch general statistics for non-student users
        try {
          const [eventsRes, studentsRes, submissionsRes, registrationsRes, facultyRes, departmentsRes] = await Promise.all([
            api.get('/events').catch(() => ({ data: { data: { events: [] } } })),
            api.get('/students').catch(() => ({ data: { data: { students: [] } } })),
            api.get('/submissions/phase-ii').catch(() => ({ data: { data: { submissions: [] } } })),
            api.get('/registrations').catch(() => ({ data: { data: { registrations: [] } } })),
            api.get('/faculty').catch(() => ({ data: { data: { faculty: [] } } })),
            api.get('/departments').catch(() => ({ data: { data: { departments: [] } } }))
          ]);

          const events = eventsRes.data.data?.events || [];
          const students = studentsRes.data.data?.students || [];
          const submissions = submissionsRes.data.data?.submissions || [];
          const registrations = registrationsRes.data.data?.registrations || [];
          const facultyList = facultyRes.data.data?.faculty || [];
          const departments = departmentsRes.data.data?.departments || [];

        const getDepartmentName = (deptId) => {
          const d = departments.find(dep => dep._id?.toString() === deptId?.toString());
          return d?.name || 'Unknown Department';
        };

        const getFacultyMeta = (facId) => {
          const f = facultyList.find(fac => fac._id?.toString() === facId?.toString());
          return f ? { 
            name: [f.firstName, f.lastName].filter(Boolean).join(' ') || f.name || 'Faculty',
            departmentId: f.departmentId
          } : { name: 'Faculty', departmentId: null };
        };

        const getStudentMeta = (stuId) => {
          const s = students.find(stu => stu._id?.toString() === stuId?.toString());
          const name = s?.name || s?.fullName || [s?.firstName, s?.lastName].filter(Boolean).join(' ') || s?.registerNumber || 'Student';
          return { name, mentorId: s?.mentorId, departmentId: s?.departmentId };
        };

        // Calculate actual statistics from data
        const safeDate = (value) => {
          const d = value ? new Date(value) : null;
          return d && !Number.isNaN(d.getTime()) ? d : null;
        };

        const now = new Date();
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Active participants = students registered for events
        const activeStudents = new Set(registrations.filter(r => !r.isCancelled).map(r => r.studentId?.toString()));
        const activeParticipantsCount = activeStudents.size;

        // Calculate highest active user = student with most event registrations
        const studentEventCounts = {};
        registrations.filter(r => !r.isCancelled).forEach(reg => {
          const id = reg.studentId?.toString();
          if (id) {
            studentEventCounts[id] = (studentEventCounts[id] || 0) + 1;
          }
        });
        const maxEvents = Math.max(...Object.values(studentEventCounts), 0);

        // Prize-bearing submissions filtered to APPROVED
        const prizeAwardedSubmissions = submissions.filter(sub => {
          const prizeAmount = Number(sub.prizeDetails?.prizeAmount || 0);
          const wonPrize = sub.prizeDetails?.wonPrize;
          return prizeAmount > 0 && wonPrize && sub.status === 'APPROVED';
        });

        const registrationsLast7d = registrations.filter(r => {
          const d = safeDate(r.registrationDate || r.createdAt || r.updatedAt);
          return !r.isCancelled && d && d >= last7d;
        }).length;

        const submissionsLast7d = submissions.filter(s => {
          const d = safeDate(s.submittedAt || s.createdAt || s.updatedAt);
          return d && d >= last7d;
        });
        const approvalsLast7d = submissionsLast7d.filter(s => s.status === 'APPROVED');

        // Active events = events with startDate today or in the past, not archived, published or ongoing
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const ongoingEvents = events.filter(e => {
          if (!e.startDate) return false;
          const eventStart = new Date(e.startDate);
          eventStart.setHours(0, 0, 0, 0);
          return eventStart.getTime() <= todayStart.getTime() && e.status === 'ONGOING' && !e.isArchived;
        }).length;
        
        const upcomingEvents = events.filter(e => e.status === 'PUBLISHED' && !e.isArchived).length;
        
        // All active events (published or ongoing, from today or past, not archived)
        const allActiveEvents = events.filter(e => {
          if (!e.startDate) return false;
          const eventStart = new Date(e.startDate);
          eventStart.setHours(0, 0, 0, 0);
          const isActiveDate = eventStart.getTime() <= todayStart.getTime();
          const isNotArchived = !e.isArchived;
          const isPublished = ['PUBLISHED', 'ONGOING'].includes(e.status);
          return isActiveDate && isNotArchived && isPublished;
        }).length;

        // Calculate prize statistics from submissions if available
        let totalPrizeWon = 0;
        let highestPrizeAmount = 0;
        let internalPrizeTotal = 0;
        let internalHighestPrize = 0;
        let externalPrizeTotal = 0;
        let externalHighestPrize = 0;
        let recentPrizeTotal7d = 0;

        const departmentPrizeTotals = {};
        const facultyPrizeTotals = {};
        const studentPrizeTotals = {};

        prizeAwardedSubmissions.forEach(sub => {
          const prizeAmount = Number(sub.prizeDetails?.prizeAmount || 0);
          totalPrizeWon += prizeAmount;
          highestPrizeAmount = Math.max(highestPrizeAmount, prizeAmount);

          const prizeDate = safeDate(sub.updatedAt || sub.submittedAt || sub.createdAt);
          if (prizeDate && prizeDate >= last7d) {
            recentPrizeTotal7d += prizeAmount;
          }

          const event = events.find(e => e._id?.toString() === sub.eventId?.toString());
          const isExternal = event?.visibility === 'EXTERNAL';
          const deptId = event?.departmentId;

          if (deptId) {
            departmentPrizeTotals[deptId] = (departmentPrizeTotals[deptId] || 0) + prizeAmount;
          }

          // Student aggregation
          const studentId = sub.studentId?.toString();
          if (studentId) {
            studentPrizeTotals[studentId] = studentPrizeTotals[studentId] || { events: new Set(), total: 0 };
            studentPrizeTotals[studentId].events.add(sub.eventId?.toString());
            studentPrizeTotals[studentId].total += prizeAmount;
          }

          // Faculty aggregation via mentorId on student
          const { mentorId } = getStudentMeta(sub.studentId);
          const mentorKey = mentorId?.toString();
          if (mentorKey) {
            facultyPrizeTotals[mentorKey] = facultyPrizeTotals[mentorKey] || { teams: new Set(), total: 0 };
            facultyPrizeTotals[mentorKey].teams.add(sub.eventId?.toString());
            facultyPrizeTotals[mentorKey].total += prizeAmount;
          }

          if (isExternal) {
            externalPrizeTotal += prizeAmount;
            externalHighestPrize = Math.max(externalHighestPrize, prizeAmount);
          } else {
            internalPrizeTotal += prizeAmount;
            internalHighestPrize = Math.max(internalHighestPrize, prizeAmount);
          }
        });

        // Department with highest prize total
        let topDepartment = { name: 'N/A', total: 0 };
        Object.entries(departmentPrizeTotals).forEach(([deptId, total]) => {
          if (total > topDepartment.total) {
            topDepartment = { name: getDepartmentName(deptId), total };
          }
        });

        // Faculty with highest prize total
        let topFaculty = { name: 'N/A', department: 'N/A', teams: 0, total: 0 };
        Object.entries(facultyPrizeTotals).forEach(([facultyId, info]) => {
          if (info.total > topFaculty.total) {
            const meta = getFacultyMeta(facultyId);
            topFaculty = {
              name: meta.name,
              department: getDepartmentName(meta.departmentId),
              teams: info.teams.size,
              total: info.total
            };
          }
        });

        // Student with highest prize total
        let topStudent = { name: 'N/A', events: 0, total: 0 };
        Object.entries(studentPrizeTotals).forEach(([stuId, info]) => {
          if (info.total > topStudent.total) {
            const meta = getStudentMeta(stuId);
            topStudent = {
              name: meta.name,
              events: info.events.size,
              total: info.total
            };
          }
        });

        const completedSubmissions = submissions.filter(s => s.status === 'APPROVED').length;
        const completionRate = submissions.length > 0 ? ((completedSubmissions / submissions.length) * 100).toFixed(1) : 0;

        const submissionVelocity7d = submissionsLast7d.length;
        const approvalRate7d = submissionsLast7d.length > 0 ? ((approvalsLast7d.length / submissionsLast7d.length) * 100).toFixed(1) : '0.0';
        const averagePrizePerWinningTeam = prizeAwardedSubmissions.length > 0 ? totalPrizeWon / prizeAwardedSubmissions.length : 0;
        const dataFreshness = now.toISOString();

        setDashboardData({
          generalStats: {
            totalEvents: events.length,
            activeEvents: allActiveEvents,
            totalStudents: students.length,
            totalSubmissions: submissions.length,
            pendingApprovals: submissions.filter(s => s.status === 'PENDING' || s.status === 'REVISION_REQUESTED').length,
            approvedSubmissions: completedSubmissions,
            activeParticipants: activeParticipantsCount,
            prizeWinners: prizeAwardedSubmissions.length,
            facultyCount: facultyList.length
          },
          analyticsStats: {
            totalEventsPosted: events.length,
            activeParticipants: activeParticipantsCount,
            highestActiveUser: maxEvents,
            completionRate: completionRate,
            registrationsLast7d,
            submissionsLast7d: submissionVelocity7d,
            approvalRate7d,
            ongoingEvents,
            upcomingEvents,
            recentPrizeTotal7d,
            averagePrizePerWinningTeam,
            dataFreshness,
            totalPrizeWon: totalPrizeWon,
            highestPrizeAmount: highestPrizeAmount,
            internalPrizeTotal: internalPrizeTotal,
            internalHighestPrize: internalHighestPrize,
            externalPrizeTotal: externalPrizeTotal,
            externalHighestPrize: externalHighestPrize,
            topDepartment,
            topFaculty,
            topStudent,
            topPerformers: [
              { _id: '1', name: 'Arun Kumar', rollNumber: 'CS001', year: '1', dept: 'CSE', section: 'A', eventsParticipated: 8, prizesWon: 3, prizeAmount: 25000, credits: 45, rank: 1 },
              { _id: '2', name: 'Priya Sharma', rollNumber: 'CS002', year: '1', dept: 'CSE', section: 'B', eventsParticipated: 7, prizesWon: 2, prizeAmount: 18000, credits: 38, rank: 2 },
              { _id: '3', name: 'Rajesh Patel', rollNumber: 'CS003', year: '2', dept: 'CSE', section: 'A', eventsParticipated: 9, prizesWon: 4, prizeAmount: 32000, credits: 52, rank: 3 },
              { _id: '4', name: 'Neha Singh', rollNumber: 'IT001', year: '2', dept: 'IT', section: 'C', eventsParticipated: 6, prizesWon: 2, prizeAmount: 15000, credits: 35, rank: 4 },
              { _id: '5', name: 'Vikram Reddy', rollNumber: 'CS004', year: '1', dept: 'CSE', section: 'C', eventsParticipated: 5, prizesWon: 1, prizeAmount: 10000, credits: 28, rank: 5 },
              { _id: '6', name: 'Anjali Verma', rollNumber: 'IT002', year: '1', dept: 'IT', section: 'B', eventsParticipated: 8, prizesWon: 3, prizeAmount: 22000, credits: 42, rank: 6 },
              { _id: '7', name: 'Arjun Nair', rollNumber: 'CS005', year: '2', dept: 'CSE', section: 'B', eventsParticipated: 7, prizesWon: 2, prizeAmount: 16000, credits: 36, rank: 7 },
              { _id: '8', name: 'Deepika Gupta', rollNumber: 'IT003', year: '2', dept: 'IT', section: 'A', eventsParticipated: 10, prizesWon: 5, prizeAmount: 38000, credits: 58, rank: 8 },
              { _id: '9', name: 'Sanjay Verma', rollNumber: 'CS006', year: '3', dept: 'CSE', section: 'D', eventsParticipated: 6, prizesWon: 2, prizeAmount: 14000, credits: 32, rank: 9 },
              { _id: '10', name: 'Meera Patel', rollNumber: 'IT004', year: '3', dept: 'IT', section: 'C', eventsParticipated: 8, prizesWon: 3, prizeAmount: 20000, credits: 40, rank: 10 },
              { _id: '11', name: 'Rohan Singh', rollNumber: 'CS007', year: '3', dept: 'CSE', section: 'B', eventsParticipated: 9, prizesWon: 4, prizeAmount: 28000, credits: 48, rank: 11 },
              { _id: '12', name: 'Pooja Desai', rollNumber: 'IT005', year: '4', dept: 'IT', section: 'A', eventsParticipated: 10, prizesWon: 5, prizeAmount: 35000, credits: 55, rank: 12 },
              { _id: '13', name: 'Karan Patel', rollNumber: 'CS008', year: '4', dept: 'CSE', section: 'D', eventsParticipated: 7, prizesWon: 3, prizeAmount: 21000, credits: 43, rank: 13 },
              { _id: '14', name: 'Ravi Kumar', rollNumber: 'IT006', year: '4', dept: 'IT', section: 'B', eventsParticipated: 8, prizesWon: 2, prizeAmount: 17000, credits: 37, rank: 14 }
            ]
          },
          rawData: {
            events,
            registrations,
            submissions,
            students
          }
        });
        } catch (dataErr) {
          console.error('Error processing dashboard data:', dataErr);
          // Set default dashboard data on error
          setDashboardData({
            generalStats: {
              totalEvents: 0,
              activeEvents: 0,
              totalStudents: 0,
              totalSubmissions: 0,
              pendingApprovals: 0,
              approvedSubmissions: 0,
              activeParticipants: 0,
              prizeWinners: 0,
              facultyCount: 0
            },
            analyticsStats: {}
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">Failed to load dashboard: {error}</Typography>
      </Box>
    );
  }

  // Helper component for stat card
  const StatCard = ({ title, value, icon, color }) => (
    <Grid item xs={12} sm={6} md={4}>
      <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', height: '100%', minHeight: 120 }}>
        <Box
          sx={{
            bgcolor: color,
            color: 'white',
            p: 2,
            borderRadius: 2,
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="h4">{value}</Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Paper>
    </Grid>
  );

  const ThemeToggle = () => (
    <Tooltip title={`Switch to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`}>
      <IconButton onClick={colorMode.toggleColorMode} color="inherit">
        {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
      </IconButton>
    </Tooltip>
  );

  // STUDENT DASHBOARD
  if (user?.studentId) {
    const stats = dashboardData?.stats ? [
      { title: 'My Events', value: dashboardData.stats.totalEvents.toString(), icon: <Event />, color: '#1976D2' },
      { title: 'My Submissions', value: dashboardData.stats.submissions.toString(), icon: <Assignment />, color: '#2E7D32' },
      { title: 'Approved', value: dashboardData.stats.approved.toString(), icon: <CheckCircle />, color: '#4CAF50' },
      { title: 'Prizes Won', value: dashboardData.stats.prizesWon.toString(), icon: <EmojiEvents />, color: '#F57C00' },
    ] : [];

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4">Welcome, {user?.firstName}! 👋</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Track your participation and submissions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ThemeToggle />
            <Button 
              variant="outlined" 
              startIcon={<Refresh />}
              onClick={fetchDashboardData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </Grid>

        {/* On-Duty Balance Section */}
        {dashboardData?.onDuty && (
          <Paper sx={{ p: 3, mt: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              🎓 On-Duty Balance
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Allowed</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>{dashboardData.onDuty.totalAllowed}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Availed</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>{dashboardData.onDuty.availed}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Balance Remaining</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1, color: dashboardData.onDuty.balance > 0 ? '#4caf50' : '#ff9800' }}>
                    {dashboardData.onDuty.balance}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📝 Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="outlined" fullWidth>View My Events</Button>
                <Button variant="outlined" fullWidth>Submit New Event</Button>
                <Button variant="outlined" fullWidth>Check Approvals</Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                ⏰ Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your recent submissions and approvals will appear here.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // FACULTY DASHBOARD
  if (user?.role === 'FACULTY') {
    const facultyStats = [
      { title: 'Total Events', value: dashboardData?.generalStats?.totalEvents.toString() || '0', icon: <Event />, color: '#1976D2' },
      { title: 'Pending Approvals', value: dashboardData?.generalStats?.pendingApprovals.toString() || '0', icon: <Pending />, color: '#F57C00' },
      { title: 'My Submissions', value: dashboardData?.generalStats?.totalSubmissions.toString() || '0', icon: <Assignment />, color: '#2E7D32' },
      { title: 'Approved', value: dashboardData?.generalStats?.approvedSubmissions.toString() || '0', icon: <CheckCircle />, color: '#4CAF50' },
    ];

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4">Welcome, {user?.firstName}! 👨‍🏫</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Role: Faculty | Manage approvals and submissions
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ThemeToggle />
            <Button 
              variant="outlined" 
              startIcon={<Refresh />}
              onClick={fetchDashboardData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {facultyStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </Grid>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <Typography variant="h6" gutterBottom>
                ✅ Approval Queue
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {dashboardData?.generalStats?.pendingApprovals || 0}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                  Pending approvals waiting for your review
                </Typography>
                <Button
                  variant="contained"
                  sx={{ mt: 2, bgcolor: 'white', color: '#f5576c' }}
                  onClick={() => navigate('/approvals')}
                >
                  Review Now
                </Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <Typography variant="h6" gutterBottom>
                📊 Performance
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>Approved</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>{dashboardData?.generalStats?.approvedSubmissions || 0}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>Pending</Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>{dashboardData?.generalStats?.pendingApprovals || 0}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // HOD DASHBOARD
  if (user?.role === 'HOD' || user?.role === 'PRINCIPAL') {
    
    // Calculate Section I metrics
    const totalEvents = dashboardData?.generalStats?.totalEvents || 0;
    const totalStudents = dashboardData?.generalStats?.totalStudents || 0;
    const studentsWithZeroParticipation = totalStudents - (dashboardData?.generalStats?.activeParticipants || 0);
    const totalFaculties = dashboardData?.generalStats?.facultyCount || 0;

    // Section II metrics
    const totalSubmissions = dashboardData?.generalStats?.totalSubmissions || 0;
    const pendingApprovals = dashboardData?.generalStats?.pendingApprovals || 0;
    const approvedSubmissions = dashboardData?.generalStats?.approvedSubmissions || 0;
    const rejectedSubmissions = (dashboardData?.analyticsStats?.rejectedSubmissions || 0);

    // Section III metrics (apply Event Type filter: all | internal | external)
    const eventsMap = new Map((dashboardData?.rawData?.events || []).map(e => [e._id?.toString(), e]));
    const normalizeId = (idOrObj) => {
      if (!idOrObj) return undefined;
      if (typeof idOrObj === 'string') return idOrObj;
      if (typeof idOrObj === 'object') {
        // Mongo populated document or ObjectId-like
        if (idOrObj._id) return idOrObj._id.toString();
        // Fallback: try toString if available
        try { return idOrObj.toString(); } catch { return undefined; }
      }
      return undefined;
    };
    const visibilityMatches = (eventId) => {
      if (eventFilter === 'all') return true;
      const ev = eventsMap.get(normalizeId(eventId));
      if (!ev) return false;
      const rawVis = (ev.visibility || '').toString().trim().toLowerCase();
      const vis = rawVis === 'external' ? 'external' : 'internal';
      return vis === eventFilter;
    };

    const typeMatches = (eventId) => {
      if (eventCategoryFilter === 'all') return true;
      const ev = eventsMap.get(normalizeId(eventId));
      if (!ev) return false;
      const typeVal = (ev.eventType || ev?.type || '').toString().trim().toLowerCase();
      const wanted = eventCategoryFilter.toLowerCase();
      return typeVal === wanted;
    };

    const filteredRegistrations = (dashboardData?.rawData?.registrations || []).filter(r => {
      if (r.isCancelled) return false;
      const id = r.eventId;
      return visibilityMatches(id) && typeMatches(id);
    });
    const studentsParticipated = new Set(filteredRegistrations.map(r => r.studentId?.toString())).size;

    const filteredApprovedPrizeSubs = (dashboardData?.rawData?.submissions || []).filter(sub => {
      const prizeAmount = Number(sub.prizeDetails?.prizeAmount || 0);
      const wonPrize = sub.prizeDetails?.wonPrize;
      const isApproved = sub.status === 'APPROVED';
      return prizeAmount > 0 && wonPrize && isApproved && visibilityMatches(sub.eventId) && typeMatches(sub.eventId);
    });
    const studentsPrizeWon = new Set(filteredApprovedPrizeSubs.map(s => s.studentId?.toString())).size;
    const totalPrizeAmount = filteredApprovedPrizeSubs.reduce((acc, s) => acc + Number(s.prizeDetails?.prizeAmount || 0), 0);

    const totalCreditsEarned = dashboardData?.analyticsStats?.creditsEarned || 0; // keep as-is if credits are not per event

    const phaseIISubmissions = (dashboardData?.rawData?.submissions || []).filter(s => {
      // These are Phase II submissions already (source endpoint), just filter by event visibility
      return visibilityMatches(s.eventId) && typeMatches(s.eventId);
    }).length;

    // Star performers (mock data - should come from API)
    const topPerformers = dashboardData?.analyticsStats?.topPerformers || [];

    // Get unique sections and years from performers for filter dropdowns
    const uniqueSections = ['all', ...new Set(topPerformers.map(p => p.section).filter(Boolean))];
    const uniqueYears = ['all', ...new Set(topPerformers.map(p => p.year).filter(Boolean))];

    // Apply filters to performers
    const filteredPerformers = topPerformers.filter(performer => {
      const sectionMatch = performerSectionFilter === 'all' || performer.section === performerSectionFilter;
      const yearMatch = performerYearFilter === 'all' || performer.year === performerYearFilter;
      return sectionMatch && yearMatch;
    });

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4">Department Performance, {user?.firstName}! 📊</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Complete analysis of department participation and achievements
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ThemeToggle />
            <Button 
              variant="outlined" 
              startIcon={<Refresh />}
              onClick={fetchDashboardData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        {/* SECTION I: Overview Metrics */}
        <Typography variant="h6" sx={{ mb: 2, mt: 3, fontWeight: 'bold' }}>📋 Overview</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Total Events Posted</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976D2', mt: 1 }}>{totalEvents}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Total Students</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#7B1FA2', mt: 1 }}>{totalStudents}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Non-Participating Students</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#D32F2F', mt: 1 }}>{studentsWithZeroParticipation}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Total Faculties</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00897B', mt: 1 }}>{totalFaculties}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Faculty Mentors (Unique)</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#F57C00', mt: 1 }}>{dashboardData?.analyticsStats?.uniqueFacultyMentors || 0}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* SECTION II: Submission Metrics */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>📝 Submission Status</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#E8F5E9' }}>
              <Typography variant="body2" color="text.secondary">Total Submissions</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2E7D32', mt: 1 }}>{totalSubmissions}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#FFF3E0' }}>
              <Typography variant="body2" color="text.secondary">Pending Approval</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#F57C00', mt: 1 }}>{pendingApprovals}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#E8F5E9' }}>
              <Typography variant="body2" color="text.secondary">Approved</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#4CAF50', mt: 1 }}>{approvedSubmissions}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#FFEBEE' }}>
              <Typography variant="body2" color="text.secondary">Rejected</Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#C62828', mt: 1 }}>{rejectedSubmissions}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* SECTION III: Participation Metrics with Filter */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>🏆 Participation & Achievements</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button 
              variant={eventFilter === 'all' ? 'contained' : 'outlined'} 
              size="small"
              onClick={() => setEventFilter('all')}
            >
              All Events
            </Button>
            <Button 
              variant={eventFilter === 'internal' ? 'contained' : 'outlined'} 
              size="small"
              onClick={() => setEventFilter('internal')}
            >
              Internal
            </Button>
            <Button 
              variant={eventFilter === 'external' ? 'contained' : 'outlined'} 
              size="small"
              onClick={() => setEventFilter('external')}
            >
              External
            </Button>
            <Typography variant="body2" sx={{ ml: 2, mr: 1 }}>Type:</Typography>
            {allEventTypes.map((t) => (
              <Button
                key={`type-${t}`}
                variant={eventCategoryFilter === t ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setEventCategoryFilter(t)}
              >
                {t === 'all' ? 'All Types' : (t.charAt(0).toUpperCase() + t.slice(1))}
              </Button>
            ))}
          </Box>
        </Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">Students Participated</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1976D2', mt: 1 }}>{studentsParticipated}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">Prize Winners</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#FF6F00', mt: 1 }}>{studentsPrizeWon}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">Total Prize Amount</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#4CAF50', mt: 1 }}>₹{totalPrizeAmount}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">Credits Earned</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#7B1FA2', mt: 1 }}>{totalCreditsEarned}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="body2" color="text.secondary">Phase II Submissions</Typography>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#00897B', mt: 1 }}>{phaseIISubmissions}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* SECTION IV: Star Performers */}
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>⭐ Top Performers</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', alignSelf: 'center' }}>Section:</Typography>
                {uniqueSections.map(section => (
                  <Button 
                    key={section}
                    variant={performerSectionFilter === section ? 'contained' : 'outlined'} 
                    size="small"
                    onClick={() => setPerformerSectionFilter(section)}
                  >
                    {section === 'all' ? 'All Sections' : section}
                  </Button>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', alignSelf: 'center' }}>Year:</Typography>
                {uniqueYears.map(year => (
                  <Button 
                    key={year}
                    variant={performerYearFilter === year ? 'contained' : 'outlined'} 
                    size="small"
                    onClick={() => setPerformerYearFilter(year)}
                  >
                    {year === 'all' ? 'All Years' : year}
                  </Button>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>S No</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Roll</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Year</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Dept</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold' }}>Section</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Events</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Prizes</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Amount (₹)</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Credits</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>Rank</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPerformers && filteredPerformers.length > 0 ? (
                      filteredPerformers.slice(0, 5).map((performer, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{idx + 1}</td>
                          <td style={{ padding: '12px' }}>{performer.name}</td>
                          <td style={{ padding: '12px' }}>{performer.rollNumber}</td>
                          <td style={{ padding: '12px' }}>{performer.year || 'N/A'}</td>
                          <td style={{ padding: '12px' }}>{performer.dept}</td>
                          <td style={{ padding: '12px' }}>{performer.section || 'N/A'}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{performer.eventsParticipated}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{performer.prizesWon}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{performer.prizeAmount}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{performer.credits}</td>
                          <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#FF6F00' }}>#{performer.rank}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" style={{ padding: '12px', textAlign: 'center', color: '#999' }}>No performer data available for selected filters</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // SUPER_ADMIN DASHBOARD
  if (user?.role === 'SUPER_ADMIN') {
    const stats = [
      { title: 'Total Events', value: dashboardData?.generalStats?.totalEvents.toString() || '0', icon: <Event />, color: '#1976D2' },
      { title: 'Active Events', value: dashboardData?.generalStats?.activeEvents.toString() || '0', icon: <TrendingUp />, color: '#00897B' },
      { title: 'Total Submissions', value: dashboardData?.generalStats?.totalSubmissions.toString() || '0', icon: <Assignment />, color: '#2E7D32' },
      { title: 'Pending Approvals', value: dashboardData?.generalStats?.pendingApprovals.toString() || '0', icon: <Pending />, color: '#F57C00' },
      { title: 'Approved', value: dashboardData?.generalStats?.approvedSubmissions.toString() || '0', icon: <CheckCircle />, color: '#4CAF50' },
      { title: 'Total Students', value: dashboardData?.generalStats?.totalStudents.toString() || '0', icon: <School />, color: '#7B1FA2' },
    ];

    // Event type filter for participation/prize stats
    const [adminEventType, setAdminEventType] = useState('all');
    const eventsList = dashboardData?.rawData?.events || [];
    const studentsList = dashboardData?.rawData?.students || [];
    const registrations = dashboardData?.rawData?.registrations || [];
    const submissions = dashboardData?.rawData?.submissions || [];
    const eventTypes = useMemo(() => {
      const types = new Set();
      eventsList.forEach(e => {
        const t = (e?.eventType || '').toString().trim().toLowerCase();
        if (t) types.add(t);
      });
      return ['all', ...Array.from(types)];
    }, [eventsList]);

    // Class-wise stats: { [classKey]: { studentsParticipated, prizeAmount } }
    const classStats = useMemo(() => {
      // Map: year-section => { students: Set, prizeAmount }
      const stats = {};
      // Filter events by type
      const filteredEventIds = new Set(eventsList.filter(e => adminEventType === 'all' || (e.eventType || '').toLowerCase() === adminEventType).map(e => e._id?.toString()));
      // Participation: students who registered for filtered events
      registrations.forEach(r => {
        if (!filteredEventIds.has(r.eventId?.toString())) return;
        const stu = studentsList.find(s => s._id?.toString() === r.studentId?.toString());
        if (!stu) return;
        const classKey = `${stu.year || 'N/A'}-${stu.section || 'N/A'}`;
        if (!stats[classKey]) stats[classKey] = { students: new Set(), prizeAmount: 0 };
        stats[classKey].students.add(stu._id?.toString());
      });
      // Prize: sum prizeAmount for approved submissions in filtered events
      submissions.forEach(s => {
        if (!filteredEventIds.has(s.eventId?.toString())) return;
        if (s.status !== 'APPROVED') return;
        const stu = studentsList.find(stu => stu._id?.toString() === s.studentId?.toString());
        if (!stu) return;
        const classKey = `${stu.year || 'N/A'}-${stu.section || 'N/A'}`;
        if (!stats[classKey]) stats[classKey] = { students: new Set(), prizeAmount: 0 };
        stats[classKey].prizeAmount += Number(s?.prizeDetails?.prizeAmount || 0);
      });
      // Convert to array for table
      return Object.entries(stats).map(([classKey, val]) => ({
        classKey,
        studentsParticipated: val.students.size,
        prizeAmount: val.prizeAmount
      })).sort((a, b) => a.classKey.localeCompare(b.classKey));
    }, [adminEventType, eventsList, studentsList, registrations, submissions]);

    // ...existing code for latestEvents, upcomingEvents, recentPrizeWinners...
    const studentById = new Map(studentsList.map(s => [s._id?.toString(), s]));
    const eventById = new Map(eventsList.map(e => [e._id?.toString(), e]));
    const safeDate = (d) => {
      const dt = d ? new Date(d) : null;
      return dt && !Number.isNaN(dt.getTime()) ? dt : null;
    };
    const latestEvents = [...eventsList]
      .sort((a, b) => (safeDate(b.createdAt || b.startDate) - safeDate(a.createdAt || a.startDate)))
      .slice(0, 5);
    const upcomingEvents = eventsList
      .filter(e => {
        const d = safeDate(e.startDate);
        return d && d.getTime() > Date.now() && !e.isArchived;
      })
      .sort((a, b) => safeDate(a.startDate) - safeDate(b.startDate))
      .slice(0, 5);
    const recentPrizeWinners = (submissions || [])
      .filter(s => Number(s?.prizeDetails?.prizeAmount || 0) > 0 && s?.prizeDetails?.wonPrize && s?.status === 'APPROVED')
      .sort((a, b) => (safeDate(b.updatedAt || b.submittedAt || b.createdAt) - safeDate(a.updatedAt || a.submittedAt || a.createdAt)))
      .slice(0, 5)
      .map(s => {
        const stu = studentById.get(s.studentId?.toString());
        const ev = eventById.get(s.eventId?.toString());
        return {
          id: s._id,
          studentName: stu?.name || [stu?.firstName, stu?.lastName].filter(Boolean).join(' ') || 'Student',
          eventTitle: ev?.title || 'Event',
          amount: Number(s?.prizeDetails?.prizeAmount || 0),
          date: safeDate(s.updatedAt || s.submittedAt || s.createdAt)
        };
      });

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4">System Dashboard, {user?.firstName}! 🚀</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Role: Super Admin | Full system overview and control
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ThemeToggle />
            <Button 
              variant="outlined" 
              startIcon={<Refresh />}
              onClick={fetchDashboardData}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3} sx={{ mt: 1 }}>
          {stats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </Grid>

        {/* Event Type Filter and Class-wise Participation/Prize Table */}
        <Paper sx={{ p: 3, mt: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6">Participation & Prize by Class</Typography>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Event Type</InputLabel>
              <Select value={adminEventType} label="Event Type" onChange={e => setAdminEventType(e.target.value)}>
                {eventTypes.map(type => (
                  <MenuItem key={type} value={type}>{type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Class (Year-Section)</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Students Participated</th>
                  <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>Total Prize Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {classStats.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: '#888', padding: '12px' }}>No data for selected event type</td></tr>
                ) : classStats.map(row => (
                  <tr key={row.classKey} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{row.classKey}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{row.studentsParticipated}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{row.prizeAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Paper>

        {/* ...existing code for analytics, star performers, command center, latest events, etc. ... */}
        {/* Option 2: Real-Time Analytics */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', background: 'linear-gradient(135deg, #00d4ff 0%, #0099ff 100%)', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6">Real-Time Analytics</Typography>
              </Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Active Participants</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                      {dashboardData?.analyticsStats?.activeParticipants || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Registrations (Last 7d)</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                      {dashboardData?.analyticsStats?.registrationsLast7d || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Events Ongoing</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                      {dashboardData?.analyticsStats?.ongoingEvents || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Events Upcoming</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                      {dashboardData?.analyticsStats?.upcomingEvents || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Submissions (Last 7d)</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                      {dashboardData?.analyticsStats?.submissionsLast7d || 0}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Approval Rate (Last 7d)</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 1 }}>
                      {dashboardData?.analyticsStats?.approvalRate7d || 0}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Prize Awarded (Last 7d)</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                      ₹{((dashboardData?.analyticsStats?.recentPrizeTotal7d || 0) / 1000).toFixed(0)}K
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Avg Prize / Winning Team</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                      ₹{((dashboardData?.analyticsStats?.averagePrizePerWinningTeam || 0) / 1000).toFixed(0)}K
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>Last Updated</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {dashboardData?.analyticsStats?.dataFreshness ? new Date(dashboardData.analyticsStats.dataFreshness).toLocaleString() : 'N/A'}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Option 4: Star Performers & Outperforming Dept */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Assessment sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6">Star Performers</Typography>
              </Box>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Outperforming Department (Prize Total)</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                      {dashboardData?.analyticsStats?.topDepartment?.name || 'N/A'} — ₹{((dashboardData?.analyticsStats?.topDepartment?.total || 0) / 1000).toFixed(0)}K
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Star Faculty (Teams Mentored)</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                      {dashboardData?.analyticsStats?.topFaculty?.name || 'N/A'} ({dashboardData?.analyticsStats?.topFaculty?.department || 'N/A'}) — {dashboardData?.analyticsStats?.topFaculty?.teams || 0} teams | ₹{((dashboardData?.analyticsStats?.topFaculty?.total || 0) / 1000).toFixed(0)}K
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Star Student (Prize Earned)</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                      {dashboardData?.analyticsStats?.topStudent?.name || 'N/A'} — {dashboardData?.analyticsStats?.topStudent?.events || 0} events | ₹{((dashboardData?.analyticsStats?.topStudent?.total || 0) / 1000).toFixed(0)}K
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Option 5: Live Dashboard Stats - Prize Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <NotificationsActive sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6">Live Dashboard Stats - Prize Distribution</Typography>
              </Box>
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {/* Overall Prize Stats */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Prize Received</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                      ₹{(dashboardData?.analyticsStats?.totalPrizeWon / 100000 || 0).toFixed(1)}L
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Highest Prize Amount</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                      ₹{(dashboardData?.analyticsStats?.highestPrizeAmount / 1000 || 0).toFixed(0)}K
                    </Typography>
                  </Box>
                </Grid>

                {/* Internal Participation */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Internal Prize Total</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                      ₹{(dashboardData?.analyticsStats?.internalPrizeTotal / 1000 || 0).toFixed(0)}K
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Internal Highest Prize</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                      ₹{(dashboardData?.analyticsStats?.internalHighestPrize / 1000 || 0).toFixed(0)}K
                    </Typography>
                  </Box>
                </Grid>

                {/* External Participation */}
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>External Prize Total</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                      ₹{(dashboardData?.analyticsStats?.externalPrizeTotal / 1000 || 0).toFixed(0)}K
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>External Highest Prize</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
                      ₹{(dashboardData?.analyticsStats?.externalHighestPrize / 1000 || 0).toFixed(0)}K
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Option 6: Command Center */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: '#333' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Settings sx={{ mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ color: '#333' }}>Command Center</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#333', color: '#fee140' }}
                  fullWidth
                  onClick={() => navigate('/departments')}
                >
                  Manage Departments
                </Button>
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#333', color: '#fee140' }}
                  fullWidth
                  onClick={() => navigate('/reports')}
                >
                  View Reports
                </Button>
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#333', color: '#fee140' }}
                  fullWidth
                  onClick={() => navigate('/settings')}
                >
                  System Settings
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Latest & Upcoming & Winners */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Latest Events
              </Typography>
              {latestEvents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No events found</Typography>
              ) : latestEvents.map((e) => (
                <Box key={e._id} sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{e.title || 'Untitled'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(safeDate(e.createdAt || e.startDate)?.toLocaleString()) || 'N/A'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Box sx={{ fontSize: 12, px: 1, py: 0.25, borderRadius: 1, bgcolor: (e.visibility === 'EXTERNAL' ? '#fff3e0' : '#e3f2fd'), color: (e.visibility === 'EXTERNAL' ? '#ef6c00' : '#1565c0') }}>
                      {e.visibility || 'INTERNAL'}
                    </Box>
                    {e.eventType && (
                      <Box sx={{ fontSize: 12, px: 1, py: 0.25, borderRadius: 1, bgcolor: '#ede7f6', color: '#4527a0' }}>
                        {e.eventType}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Events
              </Typography>
              {upcomingEvents.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No upcoming events</Typography>
              ) : upcomingEvents.map((e) => (
                <Box key={e._id} sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{e.title || 'Untitled'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Starts {safeDate(e.startDate)?.toLocaleString() || 'N/A'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <Box sx={{ fontSize: 12, px: 1, py: 0.25, borderRadius: 1, bgcolor: (e.visibility === 'EXTERNAL' ? '#fff3e0' : '#e3f2fd'), color: (e.visibility === 'EXTERNAL' ? '#ef6c00' : '#1565c0') }}>
                      {e.visibility || 'INTERNAL'}
                    </Box>
                    {e.eventType && (
                      <Box sx={{ fontSize: 12, px: 1, py: 0.25, borderRadius: 1, bgcolor: '#ede7f6', color: '#4527a0' }}>
                        {e.eventType}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Recent Prize Winners
              </Typography>
              {recentPrizeWinners.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No prize winners yet</Typography>
              ) : recentPrizeWinners.map((w) => (
                <Box key={w.id} sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{w.studentName}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {w.eventTitle} • ₹{w.amount} • {(w.date?.toLocaleString() || 'N/A')}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Fallback
  return (
    <Box>
      <Typography variant="h4">Welcome, {user?.firstName}!</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        Role: {user?.role}
      </Typography>
    </Box>
  );
};

export default Dashboard;
