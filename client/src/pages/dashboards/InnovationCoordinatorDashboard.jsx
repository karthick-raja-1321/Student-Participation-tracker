import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VerifiedIcon from '@mui/icons-material/Verified';
import api from '../../utils/api';
import { toast } from 'react-toastify';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`approval-tabpanel-${index}`}
      aria-labelledby={`approval-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const academicYears = [
  { label: '2024-2025', from: new Date('2024-06-01'), to: new Date('2025-05-31') },
  { label: '2025-2026', from: new Date('2025-06-01'), to: new Date('2026-05-31') },
];

const InnovationCoordinatorDashboard = () => {
  const [stats, setStats] = useState({
    submissionsReviewing: 0,
    submissionsApproved: 0,
    submissionsRejected: 0,
    prizeAwards: 0,
    pastApprovals: 0,
  });
  const [eventTypes, setEventTypes] = useState([]);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [phaseISubmissions, setPhaseISubmissions] = useState([]);
  const [phaseIISubmissions, setPhaseIISubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [approvalData, setApprovalData] = useState({
    status: 'APPROVED',
    comments: '',
  });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [classFilter, setClassFilter] = useState('all');
  const [classes, setClasses] = useState([]);
  const [phaseIStats, setPhaseIStats] = useState({ total: 0, approved: 0, rejected: 0, underReview: 0 });
  const [phaseIIStats, setPhaseIIStats] = useState({ total: 0, approved: 0, rejected: 0, underReview: 0 });

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const eventsRes = await api.get('/events');
        const allEvents = eventsRes.data.data?.events || [];
        const types = Array.from(new Set(allEvents.map(e => (e.eventType || '').toLowerCase()).filter(Boolean)));
        setEventTypes(['all', ...types]);
      } catch {}
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [eventTypeFilter, academicYearFilter]);

  useEffect(() => {
    if (phaseISubmissions.length > 0 || phaseIISubmissions.length > 0) {
      calculateStats(phaseISubmissions, phaseIISubmissions);
    }
  }, [classFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch statistics
      const statsResponse = await api.get('/approvals/innovation-coordinator-stats');
      setStats(statsResponse.data.data);

      // Fetch Phase I submissions
      const phaseIResponse = await api.get('/approvals/innovation-coordinator-phase-i');
      let allPhaseI = phaseIResponse.data.data.submissions || [];

      // Fetch Phase II submissions
      const phaseIIResponse = await api.get('/approvals/innovation-coordinator-phase-ii');
      let allPhaseII = phaseIIResponse.data.data.submissions || [];

      // Filter by event type
      if (eventTypeFilter && eventTypeFilter !== 'all') {
        allPhaseI = allPhaseI.filter(s => (s.eventType || '').toLowerCase() === eventTypeFilter);
        allPhaseII = allPhaseII.filter(s => (s.eventType || '').toLowerCase() === eventTypeFilter);
      }
      // Filter by academic year
      if (academicYearFilter && academicYearFilter !== 'all') {
        const yearObj = academicYears.find(y => y.label === academicYearFilter);
        if (yearObj) {
          allPhaseI = allPhaseI.filter(s => {
            const start = s.eventStartDate ? new Date(s.eventStartDate) : null;
            return start && start >= yearObj.from && start <= yearObj.to;
          });
          allPhaseII = allPhaseII.filter(s => {
            const start = s.eventStartDate ? new Date(s.eventStartDate) : null;
            return start && start >= yearObj.from && start <= yearObj.to;
          });
        }
      }

      setPhaseISubmissions(allPhaseI);
      setPhaseIISubmissions(allPhaseII);

      // Fetch classes
      const classesRes = await api.get('/departments');
      const deptClasses = classesRes.data.data?.departments || [];
      setClasses(deptClasses);

      // Calculate stats
      calculateStats(allPhaseI, allPhaseII);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (phaseI, phaseII) => {
    // Filter by class if selected
    let filteredPhaseI = phaseI;
    let filteredPhaseII = phaseII;

    if (classFilter !== 'all') {
      filteredPhaseI = phaseI.filter(sub => 
        sub.departmentId?.toString() === classFilter || sub.department?.toString() === classFilter
      );
      filteredPhaseII = phaseII.filter(sub => 
        sub.departmentId?.toString() === classFilter || sub.department?.toString() === classFilter
      );
    }

    // Calculate Phase I stats
    const phaseIApproved = filteredPhaseI.filter(s => s.innovationCoordinatorApproval?.approved === true).length;
    const phaseIRejected = filteredPhaseI.filter(s => s.innovationCoordinatorApproval?.approved === false).length;
    const phaseIUnderReview = filteredPhaseI.filter(s => s.innovationCoordinatorApproval?.approved === null).length;

    // Calculate Phase II stats
    const phaseIIApproved = filteredPhaseII.filter(s => s.status === 'APPROVED').length;
    const phaseIIRejected = filteredPhaseII.filter(s => s.status === 'REJECTED').length;
    const phaseIIUnderReview = filteredPhaseII.filter(s => s.status === 'UNDER_REVIEW' || !s.status).length;

    setPhaseIStats({
      total: filteredPhaseI.length,
      approved: phaseIApproved,
      rejected: phaseIRejected,
      underReview: phaseIUnderReview,
    });

    setPhaseIIStats({
      total: filteredPhaseII.length,
      approved: phaseIIApproved,
      rejected: phaseIIRejected,
      underReview: phaseIIUnderReview,
    });
  };

  const handleOpenDialog = (submission, tab) => {
    setSelectedSubmission({ ...submission, tab });
    setApprovalData({
      status: 'APPROVED',
      comments: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSubmission(null);
  };

  const handleApprove = async () => {
    try {
      const endpoint =
        selectedSubmission.tab === 0
          ? '/approvals/approve-phase-i'
          : '/approvals/approve-phase-ii';

      const payload = {
        submissionId: selectedSubmission._id,
        status: approvalData.status,
        comments: approvalData.comments,
        role: 'INNOVATION_COORDINATOR',
      };

      await api.post(endpoint, payload);
      toast.success('Approval submitted successfully!');
      handleCloseDialog();
      fetchDashboardData();
    } catch (err) {
      console.error('Approval error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit approval');
    }
  };

  const filteredPhaseI =
    filterStatus === 'ALL'
      ? phaseISubmissions
      : phaseISubmissions.filter((s) => s.approvalStatus === filterStatus);

  const filteredPhaseII =
    filterStatus === 'ALL'
      ? phaseIISubmissions
      : phaseIISubmissions.filter((s) => s.approvalStatus === filterStatus);

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '500px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Innovation Coordinator Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PendingActionsIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Under Review
                  </Typography>
                  <Typography variant="h5">{stats.submissionsReviewing}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Approved
                  </Typography>
                  <Typography variant="h5">{stats.submissionsApproved}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmojiEventsIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Prize Awards
                  </Typography>
                  <Typography variant="h5">{stats.prizeAwards}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VerifiedIcon sx={{ fontSize: 40, color: '#2196f3' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Verified
                  </Typography>
                  <Typography variant="h5">{stats.submissionsApproved}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Event Type & Academic Year Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Event Type</InputLabel>
          <Select value={eventTypeFilter} label="Event Type" onChange={e => setEventTypeFilter(e.target.value)}>
            {eventTypes.map(type => (
              <MenuItem key={type} value={type}>{type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Academic Year</InputLabel>
          <Select value={academicYearFilter} label="Academic Year" onChange={e => setAcademicYearFilter(e.target.value)}>
            <MenuItem value="all">All Years</MenuItem>
            {academicYears.map(y => (
              <MenuItem key={y.label} value={y.label}>{y.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Class Filter & Phase Stats */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Innovation Challenge Submissions by Class
        </Typography>
        <TextField
          select
          label="Filter by Class/Department"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          sx={{ width: 250, mb: 3 }}
        >
          <MenuItem value="all">All Classes</MenuItem>
          {classes.map((cls) => (
            <MenuItem key={cls._id} value={cls._id}>
              {cls.departmentName}
            </MenuItem>
          ))}
        </TextField>

        {/* Phase I & II Stats Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Phase I Submissions
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total</Typography>
                    <Typography variant="h5">{phaseIStats.total}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: '#4caf50' }}>Approved</Typography>
                    <Typography variant="h5" sx={{ color: '#4caf50' }}>{phaseIStats.approved}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: '#ff9800' }}>Under Review</Typography>
                    <Typography variant="h5" sx={{ color: '#ff9800' }}>{phaseIStats.underReview}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: '#f44336' }}>Rejected</Typography>
                    <Typography variant="h5" sx={{ color: '#f44336' }}>{phaseIStats.rejected}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Phase II Submissions
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>Total</Typography>
                    <Typography variant="h5">{phaseIIStats.total}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: '#4caf50' }}>Approved</Typography>
                    <Typography variant="h5" sx={{ color: '#4caf50' }}>{phaseIIStats.approved}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: '#ff9800' }}>Under Review</Typography>
                    <Typography variant="h5" sx={{ color: '#ff9800' }}>{phaseIIStats.underReview}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, color: '#f44336' }}>Rejected</Typography>
                    <Typography variant="h5" sx={{ color: '#f44336' }}>{phaseIIStats.rejected}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tabs for Phase I and Phase II */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          aria-label="approval tabs"
        >
          <Tab label="On-Duty Process (Phase I)" id="approval-tab-0" />
          <Tab label="Event Participation Proof (Phase II)" id="approval-tab-1" />
        </Tabs>
      </Box>

      {/* Filter Section - Enhanced with Pending/Past separation */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          select
          label="Filter by Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          sx={{ width: 220 }}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="PENDING">⏳ Pending Approvals</MenuItem>
          <MenuItem value="APPROVED">✓ Past - Approved</MenuItem>
          <MenuItem value="REJECTED">✗ Past - Rejected</MenuItem>
        </TextField>
        <Chip 
          label={`Pending: ${stats.submissionsReviewing}`} 
          color="warning" 
          sx={{ fontWeight: 'bold' }}
        />
        <Chip 
          label={`Past Approvals: ${stats.submissionsApproved + stats.submissionsRejected}`} 
          color="default" 
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      {/* Phase I Tab */}
      <TabPanel value={tabValue} index={0}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Register Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Event Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Participation Type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPhaseI.length > 0 ? (
                filteredPhaseI.map((submission) => (
                  <TableRow key={submission._id} hover>
                    <TableCell>
                      {submission.studentId?.firstName} {submission.studentId?.lastName}
                    </TableCell>
                    <TableCell>{submission.studentId?.registerNumber}</TableCell>
                    <TableCell>{submission.eventId?.title}</TableCell>
                    <TableCell>{submission.participationType}</TableCell>
                    <TableCell>
                      <Chip
                        label={submission.approvalStatus}
                        color={getStatusColor(submission.approvalStatus)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {submission.approvalStatus === 'PENDING' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleOpenDialog(submission, 0)}
                        >
                          Review
                        </Button>
                      )}
                      {submission.approvalStatus === 'APPROVED' && (
                        <Typography variant="caption" sx={{ color: '#4caf50' }}>
                          ✓ Approved
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No submissions found with the selected filter
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Phase II Tab */}
      <TabPanel value={tabValue} index={1}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Register Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Event Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Result</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Prize (₹)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPhaseII.length > 0 ? (
                filteredPhaseII.map((submission) => (
                  <TableRow key={submission._id} hover>
                    <TableCell>
                      {submission.studentId?.firstName} {submission.studentId?.lastName}
                    </TableCell>
                    <TableCell>{submission.studentId?.registerNumber}</TableCell>
                    <TableCell>{submission.phaseISubmissionId?.eventId?.title}</TableCell>
                    <TableCell>{submission.result}</TableCell>
                    <TableCell>{submission.prizeAmount || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={submission.approvalStatus}
                        color={getStatusColor(submission.approvalStatus)}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {submission.approvalStatus === 'PENDING' && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => handleOpenDialog(submission, 1)}
                        >
                          Review
                        </Button>
                      )}
                      {submission.approvalStatus === 'APPROVED' && (
                        <Typography variant="caption" sx={{ color: '#4caf50' }}>
                          ✓ Verified
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No submissions found with the selected filter
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Approval Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedSubmission?.tab === 0
            ? 'Review On-Duty Process (Phase I)'
            : 'Verify Event Participation Proof (Phase II)'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedSubmission && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Student:
                </Typography>
                <Typography variant="body1">
                  {selectedSubmission.studentId?.firstName} {selectedSubmission.studentId?.lastName}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="textSecondary">
                  Event:
                </Typography>
                <Typography variant="body1">
                  {selectedSubmission.eventId?.title ||
                    selectedSubmission.phaseISubmissionId?.eventId?.title}
                </Typography>
              </Box>

              {selectedSubmission.tab === 0 && (
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    Participation Type:
                  </Typography>
                  <Typography variant="body1">{selectedSubmission.participationType}</Typography>
                </Box>
              )}

              {selectedSubmission.tab === 1 && (
                <>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Result:
                    </Typography>
                    <Typography variant="body1">{selectedSubmission.result}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Prize Amount:
                    </Typography>
                    <Typography variant="body1">
                      ₹{selectedSubmission.prizeAmount || 0}
                    </Typography>
                  </Box>
                </>
              )}

              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  label="Action"
                  value={approvalData.status}
                  onChange={(e) =>
                    setApprovalData({ ...approvalData, status: e.target.value })
                  }
                >
                  <MenuItem value="APPROVED">
                    {selectedSubmission.tab === 0 ? 'Approve' : 'Verify'}
                  </MenuItem>
                  <MenuItem value="REJECTED">Reject</MenuItem>
                </Select>
              </FormControl>

              <TextField
                multiline
                rows={4}
                label="Comments"
                placeholder="Add verification comments or rejection reason..."
                value={approvalData.comments}
                onChange={(e) =>
                  setApprovalData({ ...approvalData, comments: e.target.value })
                }
                fullWidth
              />

              {approvalData.status === 'REJECTED' && (
                <Alert severity="warning">
                  The student will be notified of the rejection with your comments.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color={approvalData.status === 'APPROVED' ? 'success' : 'error'}
          >
            {approvalData.status === 'APPROVED' ? 'Submit' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default InnovationCoordinatorDashboard;
