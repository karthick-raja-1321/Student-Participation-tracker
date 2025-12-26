import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Paper, Typography, Box, CircularProgress, Button, Card, CardContent,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Divider, Alert, IconButton
} from '@mui/material';
import {
  People, Event, Assessment, EmojiEvents, TrendingUp, School,
  CheckCircle, Pending, Cancel, Person, Visibility, FilterList
} from '@mui/icons-material';
import api from '../../utils/api';

const academicYears = [
  { label: '2024-2025', from: new Date('2024-06-01'), to: new Date('2025-05-31') },
  { label: '2025-2026', from: new Date('2025-06-01'), to: new Date('2026-05-31') },
];

const HoDDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [eventTypes, setEventTypes] = useState([]);
  const [filter, setFilter] = useState({
    year: 'all',
    section: 'all',
    status: 'all',
    eventType: 'all',
    academicYear: 'all',
  });
  const [dashboardData, setDashboardData] = useState({
    section1: {
      totalEventsPosted: 0,
      totalStudents: 0,
      studentsWithZeroParticipation: 0
    },
    section2: {
      totalSubmissions: 0,
      pendingApprovals: 0,
      approvedCount: 0,
      rejectedCount: 0
    },
    section3: {
      internal: {
        studentsParticipated: 0,
        prizeWinners: 0,
        totalPrizeAmount: 0,
        creditsEarned: 0,
        phaseIISubmissions: 0
      },
      external: {
        studentsParticipated: 0,
        prizeWinners: 0,
        totalPrizeAmount: 0,
        creditsEarned: 0,
        phaseIISubmissions: 0
      }
    },
    starPerformers: [],
    pendingSubmissions: [],
    departmentNews: []
  });


  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const eventsRes = await api.get(`/events?departmentId=${user.departmentId}`);
        const allEvents = eventsRes.data.data?.events || [];
        const types = Array.from(new Set(allEvents.map(e => (e.eventType || '').toLowerCase()).filter(Boolean)));
        setEventTypes(['all', ...types]);
      } catch {}
    };
    fetchTypes();
  }, [user.departmentId]);

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch department-level data
      const [
        eventsRes,
        studentsRes,
        registrationsRes,
        phaseIRes,
        phaseIIRes
      ] = await Promise.all([
        api.get(`/events?departmentId=${user.departmentId}`),
        api.get(`/students?departmentId=${user.departmentId}`),
        api.get(`/registrations?departmentId=${user.departmentId}`),
        api.get(`/submissions/phase-i?departmentId=${user.departmentId}`),
        api.get(`/submissions/phase-ii?departmentId=${user.departmentId}`)
      ]);

      const events = eventsRes.data.data?.events || [];
      const students = studentsRes.data.data?.students || [];
      const registrations = registrationsRes.data.data?.registrations || [];
      const phaseISubmissions = phaseIRes.data.data?.submissions || [];
      const phaseIISubmissions = phaseIIRes.data.data?.submissions || [];


      // Apply filters
      let filteredEvents = events;
      if (filter.eventType && filter.eventType !== 'all') {
        filteredEvents = filteredEvents.filter(e => (e.eventType || '').toLowerCase() === filter.eventType);
      }
      if (filter.academicYear && filter.academicYear !== 'all') {
        const yearObj = academicYears.find(y => y.label === filter.academicYear);
        if (yearObj) {
          filteredEvents = filteredEvents.filter(e => {
            const start = e.startDate ? new Date(e.startDate) : null;
            return start && start >= yearObj.from && start <= yearObj.to;
          });
        }
      }

      const filteredStudents = students.filter(s => {
        if (filter.year !== 'all' && s.year !== parseInt(filter.year)) return false;
        if (filter.section !== 'all' && s.section !== filter.section) return false;
        return true;
      });

      const filteredSubmissions = phaseISubmissions.filter(s => {
        if (filter.status !== 'all' && s.status !== filter.status) return false;
        return true;
      });

      // Section 1: Events and Students
      const section1 = {
        totalEventsPosted: events.length,
        totalStudents: filteredStudents.length,
        studentsWithZeroParticipation: filteredStudents.filter(s => {
          return !registrations.some(r => r.studentId?.toString() === s._id?.toString());
        }).length
      };

      // Section 2: Submissions - Separate pending and past approvals
      const pendingHoDApprovals = filteredSubmissions.filter(s => 
        s.currentApprovalStage === 'HOD' && s.hodApproval?.approved === null
      );
      const pastApprovals = filteredSubmissions.filter(s => 
        s.hodApproval?.approved !== null && s.hodApproval?.approved !== undefined
      );

      const section2 = {
        totalSubmissions: filteredSubmissions.length,
        pendingApprovals: pendingHoDApprovals.length,
        pastApprovals: pastApprovals.length,
        approvedCount: filteredSubmissions.filter(s => s.status === 'APPROVED').length,
        rejectedCount: filteredSubmissions.filter(s => s.status === 'REJECTED').length
      };

      // Section 3: Internal vs External
      const internalEvents = filteredEvents.filter(e => e.visibility === 'INSTITUTION' || e.visibility === 'DEPARTMENT');
      const externalEvents = filteredEvents.filter(e => e.visibility === 'EXTERNAL');

      const calculateEventStats = (eventList) => {
        const eventIds = eventList.map(e => e._id?.toString());
        const relevantPhaseII = phaseIISubmissions.filter(s => 
          eventIds.includes(s.eventId?.toString())
        );

        const participatedStudents = new Set(
          relevantPhaseII.map(s => s.studentId?.toString())
        ).size;

        const prizeWinners = relevantPhaseII.filter(s => 
          s.prizeDetails?.wonPrize && s.status === 'APPROVED'
        ).length;

        const totalPrizeAmount = relevantPhaseII
          .filter(s => s.prizeDetails?.wonPrize && s.status === 'APPROVED')
          .reduce((sum, s) => sum + (s.prizeDetails.prizeAmount || 0), 0);

        const creditsEarned = relevantPhaseII
          .filter(s => s.status === 'APPROVED')
          .reduce((sum, s) => sum + (s.creditsEarned || 0), 0);

        return {
          studentsParticipated: participatedStudents,
          prizeWinners,
          totalPrizeAmount,
          creditsEarned,
          phaseIISubmissions: relevantPhaseII.length
        };
      };

      const section3 = {
        internal: calculateEventStats(internalEvents),
        external: calculateEventStats(externalEvents)
      };

      // Star Performers (Top 5)
      const studentPrizes = {};
      phaseIISubmissions
        .filter(s => s.prizeDetails?.wonPrize && s.status === 'APPROVED')
        .forEach(s => {
          const studentId = s.studentId?.toString();
          if (!studentPrizes[studentId]) {
            const student = students.find(st => st._id?.toString() === studentId);
            studentPrizes[studentId] = {
              name: student?.name || student?.userId?.firstName + ' ' + student?.userId?.lastName || 'Unknown',
              year: student?.year,
              section: student?.section,
              totalPrize: 0,
              events: 0
            };
          }
          studentPrizes[studentId].totalPrize += s.prizeDetails.prizeAmount || 0;
          studentPrizes[studentId].events += 1;
        });

      const starPerformers = Object.values(studentPrizes)
        .sort((a, b) => b.totalPrize - a.totalPrize)
        .slice(0, 5);

      // Pending submissions at HoD level
      const pendingSubmissions = phaseISubmissions
        .filter(s => s.currentApprovalStage === 'HOD' && s.hodApproval?.approved === null)
        .slice(0, 10);

      setDashboardData({
        section1,
        section2,
        section3,
        starPerformers,
        pendingSubmissions,
        departmentNews: []
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          HoD Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Department-level overview and analytics
        </Typography>
      </Box>

      {/* Filters: Year, Section, Status, Event Type, Academic Year */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <FilterList />
          </Grid>
          <Grid item xs={12} sm={2.2}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select
                value={filter.year}
                label="Year"
                onChange={(e) => setFilter({ ...filter, year: e.target.value })}
              >
                <MenuItem value="all">All Years</MenuItem>
                <MenuItem value="1">Year 1</MenuItem>
                <MenuItem value="2">Year 2</MenuItem>
                <MenuItem value="3">Year 3</MenuItem>
                <MenuItem value="4">Year 4</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2.2}>
            <FormControl fullWidth size="small">
              <InputLabel>Section</InputLabel>
              <Select
                value={filter.section}
                label="Section"
                onChange={(e) => setFilter({ ...filter, section: e.target.value })}
              >
                <MenuItem value="all">All Sections</MenuItem>
                <MenuItem value="A">Section A</MenuItem>
                <MenuItem value="B">Section B</MenuItem>
                <MenuItem value="C">Section C</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2.2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filter.status}
                label="Status"
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="SUBMITTED">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2.2}>
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={filter.eventType}
                label="Event Type"
                onChange={(e) => setFilter({ ...filter, eventType: e.target.value })}
              >
                {eventTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2.2}>
            <FormControl fullWidth size="small">
              <InputLabel>Academic Year</InputLabel>
              <Select
                value={filter.academicYear}
                label="Academic Year"
                onChange={(e) => setFilter({ ...filter, academicYear: e.target.value })}
              >
                <MenuItem value="all">All Years</MenuItem>
                {academicYears.map((y) => (
                  <MenuItem key={y.label} value={y.label}>{y.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Section I: Basic Stats */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Section I: Department Overview
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {dashboardData.section1.totalEventsPosted}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Total Events Posted
                  </Typography>
                </Box>
                <Event sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {dashboardData.section1.totalStudents}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Total Students
                  </Typography>
                </Box>
                <People sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {dashboardData.section1.studentsWithZeroParticipation}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Students (0 Participation)
                  </Typography>
                </Box>
                <Person sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section II: Submissions */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Section II: Submission Statistics
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Typography variant="h3" color="primary">
                  {dashboardData.section2.totalSubmissions}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Submissions
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Typography variant="h3" color="warning.main">
                  {dashboardData.section2.pendingApprovals}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Approvals
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Typography variant="h3" color="success.main">
                  {dashboardData.section2.approvedCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box textAlign="center">
                <Typography variant="h3" color="error.main">
                  {dashboardData.section2.rejectedCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rejected
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Approvals Alert */}
      {dashboardData.section2.pendingApprovals > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have {dashboardData.section2.pendingApprovals} submission(s) pending your approval
        </Alert>
      )}

      {/* Section III: Internal vs External */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Section III: Internal vs External Events
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              Internal Events
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Students Participated
                </Typography>
                <Typography variant="h4">
                  {dashboardData.section3.internal.studentsParticipated}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Prize Winners
                </Typography>
                <Typography variant="h4">
                  {dashboardData.section3.internal.prizeWinners}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Prize Amount
                </Typography>
                <Typography variant="h4">
                  ₹{dashboardData.section3.internal.totalPrizeAmount.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Phase II Submissions
                </Typography>
                <Typography variant="h4">
                  {dashboardData.section3.internal.phaseIISubmissions}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="secondary">
              External Events
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Students Participated
                </Typography>
                <Typography variant="h4">
                  {dashboardData.section3.external.studentsParticipated}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Prize Winners
                </Typography>
                <Typography variant="h4">
                  {dashboardData.section3.external.prizeWinners}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Prize Amount
                </Typography>
                <Typography variant="h4">
                  ₹{dashboardData.section3.external.totalPrizeAmount.toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Phase II Submissions
                </Typography>
                <Typography variant="h4">
                  {dashboardData.section3.external.phaseIISubmissions}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Star Performers */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Star Performers (Top 5)
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Section</TableCell>
                <TableCell>Events</TableCell>
                <TableCell>Total Prize</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboardData.starPerformers.map((student, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Chip
                      label={`#${index + 1}`}
                      color={index === 0 ? 'primary' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.year}</TableCell>
                  <TableCell>{student.section}</TableCell>
                  <TableCell>{student.events}</TableCell>
                  <TableCell>₹{student.totalPrize.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pending Submissions Table */}
      {dashboardData.pendingSubmissions.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            ⏳ Pending Approvals (Awaiting Your Action)
          </Typography>
          <Paper sx={{ p: 3, mb: 4 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event</TableCell>
                    <TableCell>Student</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Current Stage</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.pendingSubmissions.map((submission, index) => (
                    <TableRow key={index}>
                      <TableCell>{submission.eventDetails?.eventName || 'N/A'}</TableCell>
                      <TableCell>{submission.studentId?.name || 'N/A'}</TableCell>
                      <TableCell>
                        {new Date(submission.submittedAt || submission.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={submission.currentApprovalStage?.replace('_', ' ')}
                          color="warning"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/approvals/phase-i/${submission._id}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button
              variant="contained"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate('/approvals?tab=pending')}
            >
              View All Pending Approvals
            </Button>
          </Paper>
        </>
      )}

      {/* Past Approvals Section */}
      {dashboardData.section2.pastApprovals > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
            ✓ Past Approvals (Already Processed)
          </Typography>
          <Paper sx={{ p: 3 }}>
            <Grid container spacing={3} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h3" color="success.main">
                    {dashboardData.section2.approvedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved by You
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h3" color="error.main">
                    {dashboardData.section2.rejectedCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Rejected by You
                  </Typography>
                </Box>
              </Grid>
            </Grid>
            <Button
              variant="outlined"
              fullWidth
              sx={{ mt: 2 }}
              onClick={() => navigate('/approvals?tab=past')}
            >
              View All Past Approvals
            </Button>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default HoDDashboard;
