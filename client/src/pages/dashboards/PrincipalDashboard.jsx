import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Box, Grid, Paper, Typography, CircularProgress, Card, CardContent,
  FormControl, InputLabel, Select, MenuItem, Divider, Chip, Table, TableBody,
  TableHead, TableRow, TableCell, Button, IconButton
} from '@mui/material';
import { Event, People, Person, FilterList, EmojiEvents, Visibility } from '@mui/icons-material';
import api from '../../utils/api';

const academicYears = [
  { label: '2024-2025', from: new Date('2024-06-01'), to: new Date('2025-05-31') },
  { label: '2025-2026', from: new Date('2025-06-01'), to: new Date('2026-05-31') },
];

const PrincipalDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [filter, setFilter] = useState({
    departmentId: 'all',
    year: 'all',
    section: 'all',
    status: 'all',
    eventScope: 'ALL',
    eventType: 'all',
    academicYear: 'all',
  });
  const [dashboardData, setDashboardData] = useState({
    section1: { totalEventsPosted: 0, totalStudents: 0, studentsWithZeroParticipation: 0 },
    section2: { totalSubmissions: 0, pendingApprovals: 0, approvedCount: 0, rejectedCount: 0 },
    section3: {
      internal: { studentsParticipated: 0, prizeWinners: 0, totalPrizeAmount: 0, creditsEarned: 0, phaseIISubmissions: 0 },
      external: { studentsParticipated: 0, prizeWinners: 0, totalPrizeAmount: 0, creditsEarned: 0, phaseIISubmissions: 0 }
    },
    starPerformersConsolidated: [],
    starPerformersClasswise: [],
  });

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const depsRes = await api.get('/departments');
        setDepartments(depsRes.data.data?.departments || []);
        // Fetch event types
        const eventsRes = await api.get('/events');
        const allEvents = eventsRes.data.data?.events || [];
        const types = Array.from(new Set(allEvents.map(e => (e.eventType || '').toLowerCase()).filter(Boolean)));
        setEventTypes(['all', ...types]);
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    fetchData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventsRes, studentsRes, registrationsRes, phaseIRes, phaseIIRes] = await Promise.all([
        api.get('/events'),
        api.get('/students'),
        api.get('/registrations'),
        api.get('/submissions/phase-i'),
        api.get('/submissions/phase-ii'),
      ]);

      let events = eventsRes.data.data?.events || [];
      let students = studentsRes.data.data?.students || [];
      const registrations = registrationsRes.data.data?.registrations || [];
      let phaseISubmissions = phaseIRes.data.data?.submissions || [];
      let phaseIISubmissions = phaseIIRes.data.data?.submissions || [];

      // Apply department/year/section filters
      if (filter.departmentId !== 'all') {
        events = events.filter(e => e.departmentId?.toString() === filter.departmentId);
        students = students.filter(s => s.departmentId?.toString() === filter.departmentId);
        phaseISubmissions = phaseISubmissions.filter(s => s.departmentId?.toString() === filter.departmentId);
        phaseIISubmissions = phaseIISubmissions.filter(s => s.departmentId?.toString() === filter.departmentId);
      }
      if (filter.year !== 'all') {
        students = students.filter(s => s.year === parseInt(filter.year));
        phaseISubmissions = phaseISubmissions.filter(s => s.studentId?.year === parseInt(filter.year));
        phaseIISubmissions = phaseIISubmissions.filter(s => s.studentId?.year === parseInt(filter.year));
      }
      if (filter.section !== 'all') {
        students = students.filter(s => s.section === filter.section);
        phaseISubmissions = phaseISubmissions.filter(s => s.studentId?.section === filter.section);
        phaseIISubmissions = phaseIISubmissions.filter(s => s.studentId?.section === filter.section);
      }
      if (filter.status !== 'all') {
        phaseISubmissions = phaseISubmissions.filter(s => s.status === filter.status);
      }
      if (filter.eventType && filter.eventType !== 'all') {
        events = events.filter(e => (e.eventType || '').toLowerCase() === filter.eventType);
      }
      if (filter.academicYear && filter.academicYear !== 'all') {
        const yearObj = academicYears.find(y => y.label === filter.academicYear);
        if (yearObj) {
          events = events.filter(e => {
            const start = e.startDate ? new Date(e.startDate) : null;
            return start && start >= yearObj.from && start <= yearObj.to;
          });
        }
      }

      // Section 1
      const section1 = {
        totalEventsPosted: events.length,
        totalStudents: students.length,
        studentsWithZeroParticipation: students.filter(s => !registrations.some(r => r.studentId?.toString() === s._id?.toString())).length,
      };

      // Section 2
      const pendingApprovals = phaseISubmissions.filter(s => s.currentApprovalStage && s.currentApprovalStage !== 'COMPLETED' && (s.hodApproval?.approved === null || s.classAdvisorApproval?.approved === null || s.mentorApproval?.approved === null || s.superAdminApproval?.approved === null));
      const section2 = {
        totalSubmissions: phaseISubmissions.length,
        pendingApprovals: pendingApprovals.length,
        approvedCount: phaseISubmissions.filter(s => s.status === 'APPROVED').length,
        rejectedCount: phaseISubmissions.filter(s => s.status === 'REJECTED').length,
      };

      // Section 3: Internal vs External
      const internalEvents = events.filter(e => e.visibility === 'INSTITUTION' || e.visibility === 'DEPARTMENT');
      const externalEvents = events.filter(e => e.visibility === 'EXTERNAL');
      const calcStats = (eventList) => {
        const eventIds = new Set(eventList.map(e => e._id?.toString()));
        const relevantPhaseII = phaseIISubmissions.filter(s => eventIds.has((s.eventId || s.phaseISubmissionId?.eventId)?._id?.toString() || s.eventId?.toString()));
        const participatedStudents = new Set(relevantPhaseII.map(s => s.studentId?.toString())).size;
        const winners = relevantPhaseII.filter(s => (s.prizeDetails?.wonPrize || s.result === 'WON') && s.status === 'APPROVED');
        const totalPrizeAmount = winners.reduce((sum, s) => sum + (s.prizeDetails?.prizeAmount || s.prizeAmount || 0), 0);
        const creditsEarned = relevantPhaseII.filter(s => s.status === 'APPROVED').reduce((sum, s) => sum + (s.creditsEarned || 0), 0);
        return { studentsParticipated: participatedStudents, prizeWinners: winners.length, totalPrizeAmount, creditsEarned, phaseIISubmissions: relevantPhaseII.length };
      };
      const section3 = { internal: calcStats(internalEvents), external: calcStats(externalEvents) };

      // Star Performers (Consolidated and Class-wise)
      const prizeMap = new Map();
      phaseIISubmissions.filter(s => (s.prizeDetails?.wonPrize || s.result === 'WON') && s.status === 'APPROVED').forEach(s => {
        const id = s.studentId?.toString();
        const student = students.find(st => st._id?.toString() === id);
        if (!prizeMap.has(id)) {
          prizeMap.set(id, {
            name: student?.name || `${student?.userId?.firstName || ''} ${student?.userId?.lastName || ''}`.trim(),
            rollNumber: student?.registerNumber || student?.rollNumber,
            year: student?.year,
            dept: departments.find(d => d._id?.toString() === (student?.departmentId?.toString()))?.name || 'Dept',
            section: student?.section,
            events: 0,
            prizes: 0,
            amount: 0,
            credits: 0,
          });
        }
        const rec = prizeMap.get(id);
        rec.events += 1;
        rec.prizes += 1;
        rec.amount += (s.prizeDetails?.prizeAmount || s.prizeAmount || 0);
        rec.credits += (s.creditsEarned || 0);
      });
      const consolidatedTop5 = Array.from(prizeMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 5).map((rec, idx) => ({ ...rec, rank: idx + 1 }));
      const classwiseTop5 = Array.from(prizeMap.values()).sort((a, b) => b.amount - a.amount).slice(0, 5).map((rec, idx) => ({ ...rec, rank: idx + 1 }));

      setDashboardData({ section1, section2, section3, starPerformersConsolidated: consolidatedTop5, starPerformersClasswise: classwiseTop5 });
    } catch (e) {
      // handle errors silently
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Principal Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Institution-wide overview and consolidated analytics
        </Typography>
      </Box>

      {/* Filters: Department, Year, Section, Event Type, Academic Year */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <FilterList />
          </Grid>
          <Grid item xs={12} sm={2.4}>
            <FormControl fullWidth size="small">
              <InputLabel>Department</InputLabel>
              <Select value={filter.departmentId} label="Department" onChange={(e) => setFilter({ ...filter, departmentId: e.target.value })}>
                <MenuItem value="all">All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d._id} value={d._id?.toString()}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={1.8}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select value={filter.year} label="Year" onChange={(e) => setFilter({ ...filter, year: e.target.value })}>
                <MenuItem value="all">All Years</MenuItem>
                <MenuItem value="1">Year 1</MenuItem>
                <MenuItem value="2">Year 2</MenuItem>
                <MenuItem value="3">Year 3</MenuItem>
                <MenuItem value="4">Year 4</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={1.8}>
            <FormControl fullWidth size="small">
              <InputLabel>Section</InputLabel>
              <Select value={filter.section} label="Section" onChange={(e) => setFilter({ ...filter, section: e.target.value })}>
                <MenuItem value="all">All Sections</MenuItem>
                <MenuItem value="A">Section A</MenuItem>
                <MenuItem value="B">Section B</MenuItem>
                <MenuItem value="C">Section C</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select value={filter.eventType} label="Event Type" onChange={(e) => setFilter({ ...filter, eventType: e.target.value })}>
                {eventTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Academic Year</InputLabel>
              <Select value={filter.academicYear} label="Academic Year" onChange={(e) => setFilter({ ...filter, academicYear: e.target.value })}>
                <MenuItem value="all">All Years</MenuItem>
                {academicYears.map((y) => (
                  <MenuItem key={y.label} value={y.label}>{y.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Submission Status</InputLabel>
              <Select value={filter.status} label="Submission Status" onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
                <MenuItem value="SUBMITTED">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Section I */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
        Section I: College Overview
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3">{dashboardData.section1.totalEventsPosted}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Events Posted</Typography>
                </Box>
                <Event sx={{ fontSize: 40, color: 'text.secondary' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3">{dashboardData.section1.totalStudents}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Students</Typography>
                </Box>
                <People sx={{ fontSize: 40, color: 'text.secondary' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h3">{dashboardData.section1.studentsWithZeroParticipation}</Typography>
                  <Typography variant="body2" color="text.secondary">Students (0 Participation)</Typography>
                </Box>
                <Person sx={{ fontSize: 40, color: 'text.secondary' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Section II */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
        Section II: Submission Status
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <Card><CardContent><Box textAlign="center"><Typography variant="h3">{dashboardData.section2.totalSubmissions}</Typography><Typography variant="body2" color="text.secondary">No of Submissions</Typography></Box></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card><CardContent><Box textAlign="center"><Typography variant="h3" color="warning.main">{dashboardData.section2.pendingApprovals}</Typography><Typography variant="body2" color="text.secondary">Pending Approval</Typography></Box></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card><CardContent><Box textAlign="center"><Typography variant="h3" color="success.main">{dashboardData.section2.approvedCount}</Typography><Typography variant="body2" color="text.secondary">Approved</Typography></Box></CardContent></Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card><CardContent><Box textAlign="center"><Typography variant="h3" color="error.main">{dashboardData.section2.rejectedCount}</Typography><Typography variant="body2" color="text.secondary">Rejected</Typography></Box></CardContent></Card>
        </Grid>
      </Grid>

      {/* Section III */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
        Section III: Participation & Achievements
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">Internal Events</Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Students Participated</Typography><Typography variant="h4">{dashboardData.section3.internal.studentsParticipated}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Prize Winners</Typography><Typography variant="h4">{dashboardData.section3.internal.prizeWinners}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Total Prize Amount</Typography><Typography variant="h4">₹{dashboardData.section3.internal.totalPrizeAmount.toLocaleString()}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Credits Earned</Typography><Typography variant="h4">{dashboardData.section3.internal.creditsEarned}</Typography></Grid>
              <Grid item xs={12}><Typography variant="body2" color="text.secondary">Event Proof (Phase II) Submissions</Typography><Typography variant="h5">{dashboardData.section3.internal.phaseIISubmissions}</Typography></Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="secondary">External Events</Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Students Participated</Typography><Typography variant="h4">{dashboardData.section3.external.studentsParticipated}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Prize Winners</Typography><Typography variant="h4">{dashboardData.section3.external.prizeWinners}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Total Prize Amount</Typography><Typography variant="h4">₹{dashboardData.section3.external.totalPrizeAmount.toLocaleString()}</Typography></Grid>
              <Grid item xs={6}><Typography variant="body2" color="text.secondary">Credits Earned</Typography><Typography variant="h4">{dashboardData.section3.external.creditsEarned}</Typography></Grid>
              <Grid item xs={12}><Typography variant="body2" color="text.secondary">Event Proof (Phase II) Submissions</Typography><Typography variant="h5">{dashboardData.section3.external.phaseIISubmissions}</Typography></Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Star Performers */}
      <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
        Star Performer of the Month — Top 5
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Consolidated Analysis</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Dept</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Events</TableCell>
                  <TableCell>Prizes</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>Rank</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.starPerformersConsolidated.map((s, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.rollNumber || '-'}</TableCell>
                    <TableCell>{s.year}</TableCell>
                    <TableCell>{s.dept}</TableCell>
                    <TableCell>{s.section}</TableCell>
                    <TableCell>{s.events}</TableCell>
                    <TableCell>{s.prizes}</TableCell>
                    <TableCell>₹{(s.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{s.credits}</TableCell>
                    <TableCell>
                      <Chip label={`#${s.rank}`} color={s.rank === 1 ? 'primary' : 'default'} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Class-wise Analysis</Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>S No</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Dept</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Events</TableCell>
                  <TableCell>Prizes</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>Rank</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.starPerformersClasswise.map((s, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.rollNumber || '-'}</TableCell>
                    <TableCell>{s.year}</TableCell>
                    <TableCell>{s.dept}</TableCell>
                    <TableCell>{s.section}</TableCell>
                    <TableCell>{s.events}</TableCell>
                    <TableCell>{s.prizes}</TableCell>
                    <TableCell>₹{(s.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>{s.credits}</TableCell>
                    <TableCell>
                      <Chip label={`#${s.rank}`} color={s.rank === 1 ? 'primary' : 'default'} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PrincipalDashboard;
