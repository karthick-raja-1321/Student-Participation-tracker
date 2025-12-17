import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Grid, Paper, Typography, Box, CircularProgress, Button, Card, CardContent,
  Chip, IconButton, Badge, LinearProgress, Divider, Alert, List, ListItem,
  ListItemText, ListItemIcon, Avatar
} from '@mui/material';
import {
  Event, Assignment, CheckCircle, Pending, EmojiEvents, School,
  TrendingUp, Notifications, CalendarToday, Info, AccessTime,
  Cancel, HourglassEmpty, ThumbUp, ThumbDown, Person, Group
} from '@mui/icons-material';
import api from '../../utils/api';

const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalEvents: 0,
    eventsPosted: 0,
    eventsParticipated: 0,
    eventsApplied: 0,
    phaseISubmissions: {
      total: 0,
      approved: 0,
      rejected: 0,
      underReview: 0,
      details: []
    },
    phaseIISubmissions: {
      total: 0,
      approved: 0,
      rejected: 0,
      underReview: 0
    },
    latestEvents: [],
    upcomingDeadlines: [],
    achievements: [],
    notifications: []
  });

  useEffect(() => {
    fetchDashboardData();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch student-specific data
      const [
        eventsRes,
        registrationsRes,
        phaseIRes,
        phaseIIRes,
        notificationsRes
      ] = await Promise.all([
        api.get('/events'),
        api.get(`/registrations?studentId=${user.studentId}`),
        api.get(`/submissions/phase-i?studentId=${user.studentId}`),
        api.get(`/submissions/phase-ii?studentId=${user.studentId}`),
        api.get(`/notifications?limit=10`)
      ]);

      const events = eventsRes.data.data?.events || [];
      const registrations = registrationsRes.data.data?.registrations || [];
      const phaseISubmissions = phaseIRes.data.data?.submissions || [];
      const phaseIISubmissions = phaseIIRes.data.data?.submissions || [];
      const notifications = notificationsRes.data.data?.notifications || [];

      // Calculate statistics
      // Active events = events with startDate today or in the past, not archived, published or ongoing
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeEvents = events.filter(e => {
        if (!e.startDate) return false;
        const eventStart = new Date(e.startDate);
        eventStart.setHours(0, 0, 0, 0);
        const isActiveDate = eventStart.getTime() <= today.getTime();
        const isNotArchived = !e.isArchived;
        const isPublished = ['PUBLISHED', 'ONGOING'].includes(e.status);
        return isActiveDate && isNotArchived && isPublished;
      });
      
      const phaseIStats = {
        total: phaseISubmissions.length,
        approved: phaseISubmissions.filter(s => s.status === 'APPROVED').length,
        rejected: phaseISubmissions.filter(s => s.status === 'REJECTED').length,
        revisionRequested: phaseISubmissions.filter(s => s.status === 'REVISION_REQUESTED').length,
        underReview: phaseISubmissions.filter(s => 
          ['SUBMITTED', 'RESUBMITTED'].includes(s.status)
        ).length,
        details: phaseISubmissions.map(s => ({
          ...s,
          currentStage: s.currentApprovalStage,
          timeline: s.approvalTimeline || [],
          canResubmit: s.status === 'REVISION_REQUESTED'
        }))
      };

      const phaseIIStats = {
        total: phaseIISubmissions.length,
        approved: phaseIISubmissions.filter(s => s.status === 'APPROVED').length,
        rejected: phaseIISubmissions.filter(s => s.status === 'REJECTED').length,
        underReview: phaseIISubmissions.filter(s => 
          ['SUBMITTED', 'REVISION_REQUESTED'].includes(s.status)
        ).length
      };

      // Get upcoming deadlines (using today variable from above)
      const upcomingDeadlines = events
        .filter(e => new Date(e.endDate) > today && !e.isArchived)
        .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
        .slice(0, 5);

      // Get achievements
      const achievements = phaseIISubmissions.filter(s => 
        s.prizeDetails?.wonPrize && s.status === 'APPROVED'
      );

      setDashboardData({
        totalEvents: activeEvents.length,
        eventsPosted: events.filter(e => e.createdBy === user._id).length,
        eventsParticipated: registrations.filter(r => r.status === 'CONFIRMED').length,
        eventsApplied: registrations.length,
        phaseISubmissions: phaseIStats,
        phaseIISubmissions: phaseIIStats,
        latestEvents: activeEvents.slice(0, 5),
        upcomingDeadlines,
        achievements,
        notifications: notifications.slice(0, 5)
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (stage) => {
    const stages = {
      'MENTOR': <Person fontSize="small" />,
      'CLASS_ADVISOR': <School fontSize="small" />,
      'INNOVATION_COORDINATOR': <TrendingUp fontSize="small" />,
      'HOD': <Person fontSize="small" />,
      'PRINCIPAL': <Person fontSize="small" />
    };
    return stages[stage] || <HourglassEmpty fontSize="small" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'APPROVED': 'success',
      'REJECTED': 'error',
      'SUBMITTED': 'info',
      'DRAFT': 'default',
      'REVISION_REQUESTED': 'warning'
    };
    return colors[status] || 'default';
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
          Welcome, {user.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your event participation and submissions
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {dashboardData.totalEvents}
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
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {dashboardData.eventsParticipated}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Events Participated
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
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
                    {dashboardData.eventsApplied}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Events Applied
                  </Typography>
                </Box>
                <Assignment sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
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
                    {dashboardData.achievements.length}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Achievements
                  </Typography>
                </Box>
                <EmojiEvents sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Submission Status */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Assignment sx={{ mr: 1 }} />
              On-Duty Applications (Phase I)
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            {/* Show alert if there are revisions needed */}
            {dashboardData.phaseISubmissions.revisionRequested > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                You have {dashboardData.phaseISubmissions.revisionRequested} submission(s) that need revision and resubmission
              </Alert>
            )}
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h3" color="success.main">
                    {dashboardData.phaseISubmissions.approved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h3" color="info.main">
                    {dashboardData.phaseISubmissions.underReview}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Under Review
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box textAlign="center">
                  <Typography variant="h3" color="warning.main">
                    {dashboardData.phaseISubmissions.revisionRequested || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Need Revision
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <LinearProgress
              variant="determinate"
              value={
                dashboardData.phaseISubmissions.total > 0
                  ? (dashboardData.phaseISubmissions.approved / dashboardData.phaseISubmissions.total) * 100
                  : 0
              }
              sx={{ mb: 2, height: 8, borderRadius: 1 }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/submissions/phase-i/new')}
              sx={{ mt: 2 }}
            >
              Submit On-Duty Application
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <EmojiEvents sx={{ mr: 1 }} />
              Event Participation Proof (Phase II)
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h3" color="success.main">
                    {dashboardData.phaseIISubmissions.approved}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box textAlign="center">
                  <Typography variant="h3" color="info.main">
                    {dashboardData.phaseIISubmissions.underReview}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Under Review
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <LinearProgress
              variant="determinate"
              value={
                dashboardData.phaseIISubmissions.total > 0
                  ? (dashboardData.phaseIISubmissions.approved / dashboardData.phaseIISubmissions.total) * 100
                  : 0
              }
              sx={{ mb: 2, height: 8, borderRadius: 1 }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={() => navigate('/submissions/phase-ii/new')}
              sx={{ mt: 2 }}
            >
              Submit Participation Proof
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Approval Timeline - Pending and Past Approvals */}
      {dashboardData.phaseISubmissions.details.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Approval Status Timeline
          </Typography>
          <Divider sx={{ my: 2 }} />
          
          {dashboardData.phaseISubmissions.details.slice(0, 3).map((submission, index) => {
            // Separate past and pending approvals
            const stages = ['MENTOR', 'CLASS_ADVISOR', 'INNOVATION_COORDINATOR', 'HOD', 'PRINCIPAL'];
            const currentStageIndex = stages.indexOf(submission.currentStage);
            const pastStages = submission.timeline?.filter(t => t.action === 'APPROVED' || t.action === 'REJECTED') || [];
            const pendingStages = currentStageIndex >= 0 ? stages.slice(currentStageIndex) : [];

            return (
              <Box key={index} sx={{ mb: 4, pb: 3, borderBottom: index < 2 ? '1px solid #e0e0e0' : 'none' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {submission.eventDetails?.eventName || 'Event'}
                  </Typography>
                  <Box display="flex" gap={1} alignItems="center">
                    <Chip
                      label={submission.status}
                      color={getStatusColor(submission.status)}
                      size="small"
                    />
                    {submission.canResubmit && (
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        onClick={() => navigate(`/submissions/phase-i/${submission._id}/edit`)}
                      >
                        Edit & Resubmit
                      </Button>
                    )}
                  </Box>
                </Box>
                
                {/* Past Approvals Section */}
                {pastStages.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                      ✓ Past Approvals ({pastStages.length})
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {pastStages.map((stage, idx) => (
                        <Box key={idx} display="flex" alignItems="center" sx={{ ml: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: stage.action === 'REJECTED' ? 'error.main' : 'success.main',
                              width: 32,
                              height: 32,
                              mr: 1
                            }}
                          >
                            {stage.action === 'REJECTED' ? <Cancel /> : <CheckCircle />}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="body2" fontWeight="medium">
                              {stage.stage.replace('_', ' ')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {stage.action === 'APPROVED' ? 'Approved' : 'Rejected'} on {new Date(stage.timestamp).toLocaleDateString()}
                              {stage.comments && ` - ${stage.comments}`}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Pending Approvals Section */}
                {pendingStages.length > 0 && submission.status !== 'APPROVED' && submission.status !== 'REJECTED' && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="primary" sx={{ mb: 1, fontWeight: 'bold' }}>
                      ⏳ Pending Approvals ({pendingStages.length})
                    </Typography>
                    <Box display="flex" flexDirection="column" gap={1}>
                      {pendingStages.map((stage, idx) => {
                        const isCurrentStage = stage === submission.currentStage;
                        return (
                          <Box key={idx} display="flex" alignItems="center" sx={{ ml: 2 }}>
                            <Avatar
                              sx={{
                                bgcolor: isCurrentStage ? 'primary.main' : 'grey.300',
                                width: 32,
                                height: 32,
                                mr: 1
                              }}
                            >
                              {isCurrentStage ? <HourglassEmpty /> : <Pending />}
                            </Avatar>
                            <Box flex={1}>
                              <Typography variant="body2" fontWeight={isCurrentStage ? 'bold' : 'medium'}>
                                {stage.replace('_', ' ')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {isCurrentStage ? 'Awaiting approval...' : 'In queue'}
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}

                {/* Full Timeline Visual */}
                <Box display="flex" alignItems="center" sx={{ mt: 2 }}>
                  {stages.map((stage, idx) => {
                    const stageData = submission.timeline?.find(t => t.stage === stage);
                    const isActive = submission.currentStage === stage;
                    const isCompleted = stageData?.action === 'APPROVED';
                    const isRejected = stageData?.action === 'REJECTED';

                    return (
                      <React.Fragment key={stage}>
                        <Box textAlign="center">
                          <Avatar
                            sx={{
                              bgcolor: isRejected ? 'error.main' : isCompleted ? 'success.main' : isActive ? 'primary.main' : 'grey.300',
                              width: 40,
                              height: 40
                            }}
                          >
                            {isRejected ? <Cancel /> : isCompleted ? <CheckCircle /> : getStageIcon(stage)}
                          </Avatar>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {stage.replace('_', ' ')}
                          </Typography>
                        </Box>
                        {idx < 4 && (
                          <Box
                            sx={{
                              flex: 1,
                              height: 2,
                              bgcolor: isCompleted ? 'success.main' : 'grey.300',
                              mx: 1
                            }}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </Box>
              </Box>
            );
          })}

          <Button
            variant="outlined"
            fullWidth
            onClick={() => navigate('/submissions/phase-i')}
            sx={{ mt: 2 }}
          >
            View All Submissions
          </Button>
        </Paper>
      )}

      {/* Bottom Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Latest Events
            </Typography>
            <Divider sx={{ my: 2 }} />
            
            <List>
              {dashboardData.latestEvents.map((event, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => navigate(`/events/${event._id}`)}
                  sx={{ borderRadius: 1, mb: 1, bgcolor: 'background.default' }}
                >
                  <ListItemIcon>
                    <Event color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={event.title}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {new Date(event.startDate).toLocaleDateString()}
                        </Typography>
                        <Chip
                          label={event.visibility}
                          size="small"
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">
                Recent Notifications
              </Typography>
              <IconButton onClick={() => navigate('/notifications')}>
                <Badge badgeContent={dashboardData.notifications.filter(n => !n.isRead).length} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              {dashboardData.notifications.map((notification, index) => (
                <ListItem
                  key={index}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: notification.isRead ? 'background.default' : 'action.hover'
                  }}
                >
                  <ListItemIcon>
                    <Notifications color={notification.isRead ? 'action' : 'primary'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={notification.title}
                    secondary={
                      <Typography variant="caption">
                        {new Date(notification.createdAt).toLocaleString()}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/notifications')}
              sx={{ mt: 2 }}
            >
              View All Notifications
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDashboard;
