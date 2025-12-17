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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import CancelIcon from '@mui/icons-material/Cancel';
import AssignmentIcon from '@mui/icons-material/Assignment';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ClassAdvisorDashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    submissionsApproved: 0,
    submissionsPending: 0,
    submissionsRejected: 0,
    pastApprovals: 0,
    phaseI: {
      total: 0,
      approved: 0,
      rejected: 0,
      underReview: 0,
    },
    phaseII: {
      total: 0,
      approved: 0,
      rejected: 0,
      underReview: 0,
    },
  });
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: 'APPROVED',
    comments: '',
    mentorId: '',
  });
  const [faculty, setFaculty] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchDashboardData();
    fetchFaculty();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchFaculty();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Fetch all students in class advisor's class
      const studentsRes = await api.get(`/students?classAdvisorId=${user.facultyId}`);
      const students = studentsRes.data.data?.students || [];

      // Fetch Phase I submissions for the class
      const phaseIRes = await api.get(`/submissions/phase-i`);
      const phaseISubmissions = phaseIRes.data.data?.submissions || [];
      
      // Filter Phase I for students in this class
      const classPhaseI = phaseISubmissions.filter(sub => 
        students.some(s => s._id === sub.studentId || s._id === sub.students?.[0])
      );

      // Fetch Phase II submissions for the class
      const phaseIIRes = await api.get(`/submissions/phase-ii`);
      const phaseIISubmissions = phaseIIRes.data.data?.submissions || [];
      
      // Filter Phase II for students in this class
      const classPhaseII = phaseIISubmissions.filter(sub => 
        students.some(s => s._id === sub.studentId || s._id === sub.students?.[0])
      );

      // Calculate Phase I stats
      const phaseIApproved = classPhaseI.filter(s => s.innovationCoordinatorApproval?.approved === true).length;
      const phaseIRejected = classPhaseI.filter(s => s.innovationCoordinatorApproval?.approved === false).length;
      const phaseIUnderReview = classPhaseI.filter(s => s.innovationCoordinatorApproval?.approved === null).length;

      // Calculate Phase II stats
      const phaseIIApproved = classPhaseII.filter(s => s.status === 'APPROVED').length;
      const phaseIIRejected = classPhaseII.filter(s => s.status === 'REJECTED').length;
      const phaseIIUnderReview = classPhaseII.filter(s => s.status === 'UNDER_REVIEW' || !s.status).length;

      // Fetch statistics from endpoint if available
      const statsResponse = await api.get('/approvals/class-advisor-stats');
      const statsData = statsResponse.data.data || {};

      setStats({
        totalStudents: students.length,
        submissionsApproved: statsData.submissionsApproved || 0,
        submissionsPending: statsData.submissionsPending || 0,
        submissionsRejected: statsData.submissionsRejected || 0,
        pastApprovals: statsData.pastApprovals || 0,
        phaseI: {
          total: classPhaseI.length,
          approved: phaseIApproved,
          rejected: phaseIRejected,
          underReview: phaseIUnderReview,
        },
        phaseII: {
          total: classPhaseII.length,
          approved: phaseIIApproved,
          rejected: phaseIIRejected,
          underReview: phaseIIUnderReview,
        },
      });

      // Fetch pending submissions
      const submissionsResponse = await api.get('/approvals/class-advisor-submissions');
      setSubmissions(submissionsResponse.data.data.submissions || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await api.get('/faculty');
      setFaculty(response.data.data.faculty || []);
    } catch (err) {
      console.error('Failed to load faculty:', err);
    }
  };

  const handleOpenDialog = (submission) => {
    setSelectedSubmission(submission);
    setApprovalData({
      status: 'APPROVED',
      comments: '',
      mentorId: '',
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSubmission(null);
  };

  const handleApprove = async () => {
    try {
      if (!approvalData.mentorId) {
        toast.error('Please select an Innovation Coordinator');
        return;
      }

      const payload = {
        submissionId: selectedSubmission._id,
        status: approvalData.status,
        comments: approvalData.comments,
        mentorId: approvalData.mentorId,
        role: 'CLASS_ADVISOR',
      };

      await api.post('/approvals/submit-approval', payload);
      toast.success('Approval submitted successfully!');
      handleCloseDialog();
      fetchDashboardData();
    } catch (err) {
      console.error('Approval error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit approval');
    }
  };

  const filteredSubmissions = filterStatus === 'ALL' 
    ? submissions 
    : submissions.filter(s => s.approvalStatus === filterStatus);

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
        Class Advisor Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PersonIcon sx={{ fontSize: 40, color: '#1976d2' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Students
                  </Typography>
                  <Typography variant="h5">{stats.totalStudents}</Typography>
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
                <PendingActionsIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h5">{stats.submissionsPending}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DescriptionIcon sx={{ fontSize: 40, color: '#f44336' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Rejected
                  </Typography>
                  <Typography variant="h5">{stats.submissionsRejected}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Phase I & II Submissions Stats */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2, fontWeight: 'bold' }}>
        Innovation Challenge Submissions
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {/* Phase I Stats */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Phase I Submissions
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total</Typography>
                  <Typography variant="h5">{stats.phaseI.total}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, color: '#4caf50' }}>Approved</Typography>
                  <Typography variant="h5" sx={{ color: '#4caf50' }}>{stats.phaseI.approved}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, color: '#ff9800' }}>Under Review</Typography>
                  <Typography variant="h5" sx={{ color: '#ff9800' }}>{stats.phaseI.underReview}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, color: '#f44336' }}>Rejected</Typography>
                  <Typography variant="h5" sx={{ color: '#f44336' }}>{stats.phaseI.rejected}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Phase II Stats */}
        <Grid item xs={12} sm={6}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                Phase II Submissions
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total</Typography>
                  <Typography variant="h5">{stats.phaseII.total}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, color: '#4caf50' }}>Approved</Typography>
                  <Typography variant="h5" sx={{ color: '#4caf50' }}>{stats.phaseII.approved}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, color: '#ff9800' }}>Under Review</Typography>
                  <Typography variant="h5" sx={{ color: '#ff9800' }}>{stats.phaseII.underReview}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, color: '#f44336' }}>Rejected</Typography>
                  <Typography variant="h5" sx={{ color: '#f44336' }}>{stats.phaseII.rejected}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Section - Enhanced with Pending/Past separation */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          select
          label="Filter by Status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          sx={{ width: 200 }}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="PENDING">⏳ Pending Approvals</MenuItem>
          <MenuItem value="APPROVED">✓ Past - Approved</MenuItem>
          <MenuItem value="REJECTED">✗ Past - Rejected</MenuItem>
        </TextField>
        <Chip 
          label={`Pending: ${stats.submissionsPending}`} 
          color="warning" 
          sx={{ fontWeight: 'bold' }}
        />
        <Chip 
          label={`Past Approvals: ${stats.submissionsApproved + stats.submissionsRejected}`} 
          color="default" 
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      {/* Submissions Table */}
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Student Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Register Number</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Event Title</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Submission Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubmissions.length > 0 ? (
              filteredSubmissions.map((submission) => (
                <TableRow key={submission._id} hover>
                  <TableCell>
                    {submission.studentId?.firstName} {submission.studentId?.lastName}
                  </TableCell>
                  <TableCell>{submission.studentId?.registerNumber}</TableCell>
                  <TableCell>{submission.eventId?.title}</TableCell>
                  <TableCell>
                    {new Date(submission.createdAt).toLocaleDateString()}
                  </TableCell>
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
                        onClick={() => handleOpenDialog(submission)}
                      >
                        Review
                      </Button>
                    )}
                    {submission.approvalStatus === 'APPROVED' && (
                      <Typography variant="caption" sx={{ color: '#4caf50' }}>
                        ✓ Approved
                      </Typography>
                    )}
                    {submission.approvalStatus === 'REJECTED' && (
                      <Typography variant="caption" sx={{ color: '#f44336' }}>
                        ✗ Rejected
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

      {/* Approval Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Review Student Submission</DialogTitle>
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
                  {selectedSubmission.eventId?.title}
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Assign to Innovation Coordinator</InputLabel>
                <Select
                  label="Assign to Innovation Coordinator"
                  value={approvalData.mentorId}
                  onChange={(e) =>
                    setApprovalData({ ...approvalData, mentorId: e.target.value })
                  }
                >
                  {faculty.map((f) => (
                    <MenuItem key={f._id} value={f._id}>
                      {f.firstName} {f.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Action</InputLabel>
                <Select
                  label="Action"
                  value={approvalData.status}
                  onChange={(e) =>
                    setApprovalData({ ...approvalData, status: e.target.value })
                  }
                >
                  <MenuItem value="APPROVED">Approve</MenuItem>
                  <MenuItem value="REJECTED">Reject</MenuItem>
                </Select>
              </FormControl>

              <TextField
                multiline
                rows={4}
                label="Comments"
                placeholder="Add approval comments or rejection reason..."
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
            {approvalData.status === 'APPROVED' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ClassAdvisorDashboard;
