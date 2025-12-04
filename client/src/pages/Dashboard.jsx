import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Grid, Paper, Typography, Box, CircularProgress } from '@mui/material';
import { 
  Event, Assignment, CheckCircle, EmojiEvents, 
  People, School, Pending, Assessment 
} from '@mui/icons-material';
import api from '../utils/api';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
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
          const [eventsRes, studentsRes, submissionsRes] = await Promise.all([
            api.get('/events').catch(() => ({ data: { data: { events: [] } } })),
            api.get('/students').catch(() => ({ data: { data: { students: [] } } })),
            api.get('/submissions/phase-ii').catch(() => ({ data: { data: { submissions: [] } } }))
          ]);

          const events = eventsRes.data.data?.events || [];
          const students = studentsRes.data.data?.students || [];
          const submissions = submissionsRes.data.data?.submissions || [];

          setDashboardData({
            generalStats: {
              totalEvents: events.length,
              activeEvents: events.filter(e => e.status === 'PUBLISHED' || e.status === 'ONGOING').length,
              totalStudents: students.length,
              totalSubmissions: submissions.length,
              pendingApprovals: submissions.filter(s => s.status === 'PENDING').length,
              approvedSubmissions: submissions.filter(s => s.status === 'APPROVED').length
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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

  // For non-student users, show statistics dashboard
  if (!user?.studentId && dashboardData?.generalStats) {
    const generalStats = [
      { title: 'Total Events', value: dashboardData.generalStats.totalEvents.toString(), icon: <Event />, color: '#1976D2' },
      { title: 'Active Events', value: dashboardData.generalStats.activeEvents.toString(), icon: <Assessment />, color: '#00897B' },
      { title: 'Total Submissions', value: dashboardData.generalStats.totalSubmissions.toString(), icon: <Assignment />, color: '#2E7D32' },
      { title: 'Pending Approvals', value: dashboardData.generalStats.pendingApprovals.toString(), icon: <Pending />, color: '#F57C00' },
      { title: 'Approved', value: dashboardData.generalStats.approvedSubmissions.toString(), icon: <CheckCircle />, color: '#4CAF50' },
    ];

    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Role: {user?.role}
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {generalStats.map((stat) => (
            <Grid item xs={12} sm={6} md={4} key={stat.title}>
              <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', height: '100%', minHeight: 120 }}>
                <Box
                  sx={{
                    bgcolor: stat.color,
                    color: 'white',
                    p: 2,
                    borderRadius: 2,
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h4">{stat.value}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the sidebar menu to navigate to Events, Approvals, Reports, Students, or other sections.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // For non-student users without data, show basic dashboard
  if (!user?.studentId) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Role: {user?.role}
        </Typography>
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Access
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the sidebar menu to navigate to Events, Approvals, Reports, or other sections.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Student dashboard - show only their data
  const stats = dashboardData?.stats ? [
    { title: 'My Events', value: dashboardData.stats.totalEvents.toString(), icon: <Event />, color: '#1976D2' },
    { title: 'My Submissions', value: dashboardData.stats.submissions.toString(), icon: <Assignment />, color: '#2E7D32' },
    { title: 'Approved', value: dashboardData.stats.approved.toString(), icon: <CheckCircle />, color: '#4CAF50' },
    { title: 'Prizes Won', value: dashboardData.stats.prizesWon.toString(), icon: <EmojiEvents />, color: '#F57C00' },
  ] : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.firstName}!
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Role: {user?.role}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', height: '100%', minHeight: 120 }}>
              <Box
                sx={{
                  bgcolor: stat.color,
                  color: 'white',
                  p: 2,
                  borderRadius: 2,
                  mr: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h4">{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* On-Duty Balance Section */}
      {dashboardData?.onDuty && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            On-Duty Balance
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">Total Allowed</Typography>
              <Typography variant="h5">{dashboardData.onDuty.totalAllowed}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">Availed</Typography>
              <Typography variant="h5" color="primary">{dashboardData.onDuty.availed}</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">Balance Remaining</Typography>
              <Typography variant="h5" color={dashboardData.onDuty.balance > 0 ? 'success.main' : 'error.main'}>
                {dashboardData.onDuty.balance}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Your recent submissions and approvals will appear here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Dashboard;
