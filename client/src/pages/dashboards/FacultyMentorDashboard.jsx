import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Paper, Typography, Box, CircularProgress, Button, Card, CardContent,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tabs, Tab, Badge, Divider, Alert
} from '@mui/material';
import {
  Group, CheckCircle, Cancel, Pending, Assignment, EmojiEvents,
  ThumbUp, ThumbDown, Comment, Visibility, Notifications, Event
} from '@mui/icons-material';
import api from '../../utils/api';

const FacultyMentorDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [dashboardData, setDashboardData] = useState({
    activeEvents: 0,
    teamsUnderMentorship: 0,
    pendingApprovals: 0,
    approvedTeams: 0,
    rejectedTeams: 0,
    totalPrizeAmount: 0,
    submissions: [],
    notifications: []
  });
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [action, setAction] = useState(null);
  const [comments, setComments] = useState('');

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch mentor-specific data
      const [submissionsRes, notificationsRes, studentsRes, eventsRes] = await Promise.all([
        api.get(`/submissions/phase-i?mentorId=${user.facultyId}`),
        api.get(`/notifications?limit=10`),
        api.get(`/students?mentorId=${user.facultyId}`),
        api.get(`/events`)
      ]);

      const submissions = submissionsRes.data.data?.submissions || [];
      const notifications = notificationsRes.data.data?.notifications || [];
      const students = studentsRes.data.data?.students || [];
      const allEvents = eventsRes.data.data?.events || [];

      // Count active events created by this faculty
      const activeEvents = allEvents.filter(e => 
        e.createdBy === user.facultyId && e.status === 'ONGOING'
      ).length;

      // Calculate statistics
      const pendingSubmissions = submissions.filter(s =>
        s.currentApprovalStage === 'MENTOR' && s.mentorApproval.approved === null
      );

      const approvedSubmissions = submissions.filter(s =>
        s.mentorApproval?.approved === true
      );

      const rejectedSubmissions = submissions.filter(s =>
        s.mentorApproval?.approved === false
      );

      // Calculate total prize amount from completed Phase II submissions
      const phaseIIRes = await api.get(`/submissions/phase-ii?mentorId=${user.facultyId}`);
      const phaseIISubmissions = phaseIIRes.data.data?.submissions || [];
      const totalPrizeAmount = phaseIISubmissions
        .filter(s => s.prizeDetails?.wonPrize && s.status === 'APPROVED')
        .reduce((sum, s) => sum + (s.prizeDetails.prizeAmount || 0), 0);

      setDashboardData({
        activeEvents,
        teamsUnderMentorship: students.length,
        pendingApprovals: pendingSubmissions.length,
        approvedTeams: approvedSubmissions.length,
        rejectedTeams: rejectedSubmissions.length,
        totalPrizeAmount,
        submissions: submissions.sort((a, b) => 
          new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt)
        ),
        notifications: notifications.slice(0, 5)
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalAction = async () => {
    try {
      await api.put(`/submissions/phase-i/${selectedSubmission._id}/approve`, {
        stage: 'MENTOR',
        approved: action === 'approve',
        comments
      });

      // Show success message
      alert(`Submission ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh data
      fetchDashboardData();
      
      // Close dialog
      setApprovalDialog(false);
      setComments('');
      setSelectedSubmission(null);
      setAction(null);
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('Failed to process approval');
    }
  };

  const openApprovalDialog = (submission, actionType) => {
    setSelectedSubmission(submission);
    setAction(actionType);
    setApprovalDialog(true);
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
          Mentor Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your mentee teams and approve On-Duty applications
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {dashboardData.activeEvents}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Active Events
                  </Typography>
                </Box>
                <Event sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {dashboardData.teamsUnderMentorship}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Teams Under Mentorship
                  </Typography>
                </Box>
                <Group sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {dashboardData.pendingApprovals}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Pending Approvals
                  </Typography>
                </Box>
                <Pending sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {dashboardData.approvedTeams}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Approved Teams
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    ₹{dashboardData.totalPrizeAmount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Total Prize by Mentees
                  </Typography>
                </Box>
                <EmojiEvents sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert for Pending Approvals */}
      {dashboardData.pendingApprovals > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have {dashboardData.pendingApprovals} submission(s) waiting for your approval
        </Alert>
      )}

      {/* Tabs for Submission Views - Enhanced with Past Approvals */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(e, newValue) => setTab(newValue)}>
          <Tab
            label={
              <Badge badgeContent={dashboardData.pendingApprovals} color="error">
                Pending Approvals
              </Badge>
            }
          />
          <Tab label="Past Approvals - Approved" />
          <Tab label="Past Approvals - Rejected" />
          <Tab label="All Submissions" />
        </Tabs>
      </Paper>

      {/* Submissions Table */}
      <Paper sx={{ p: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dashboardData.submissions
                .filter(s => {
                  if (tab === 0) return s.currentApprovalStage === 'MENTOR' && s.mentorApproval.approved === null;
                  if (tab === 1) return s.mentorApproval?.approved === true;
                  if (tab === 2) return s.mentorApproval?.approved === false;
                  return true;
                })
                .map((submission, index) => (
                  <TableRow key={index}>
                    <TableCell>{submission.eventDetails?.eventName || 'N/A'}</TableCell>
                    <TableCell>{submission.studentId?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {submission.teamName || 'Individual'}
                      {submission.teamMembers?.length > 0 && (
                        <Chip label={`${submission.teamMembers.length} members`} size="small" sx={{ ml: 1 }} />
                      )}
                    </TableCell>
                    <TableCell>{new Date(submission.submittedAt || submission.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Chip
                        label={submission.mentorApproval?.approved === true ? 'Approved' : submission.mentorApproval?.approved === false ? 'Rejected' : 'Pending'}
                        color={submission.mentorApproval?.approved === true ? 'success' : submission.mentorApproval?.approved === false ? 'error' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/submissions/phase-i/${submission._id}`)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      {submission.currentApprovalStage === 'MENTOR' && submission.mentorApproval.approved === null && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => openApprovalDialog(submission, 'approve')}
                            title="Approve"
                          >
                            <ThumbUp />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openApprovalDialog(submission, 'reject')}
                            title="Reject"
                          >
                            <ThumbDown />
                          </IconButton>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {action === 'approve' ? 'Approve Submission' : 'Reject Submission'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Event: {selectedSubmission?.eventDetails?.eventName}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Student: {selectedSubmission?.studentId?.name}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comments (Optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={action === 'approve' ? 'Add any remarks...' : 'Provide reason for rejection...'}
          />
          {action === 'reject' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Student will be notified to select a new mentor
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={action === 'approve' ? 'success' : 'error'}
            onClick={handleApprovalAction}
          >
            {action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FacultyMentorDashboard;
