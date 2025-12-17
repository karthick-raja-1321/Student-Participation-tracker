import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  AccessTime,
  ArrowBack,
  PersonOutline,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const PhaseISubmissionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubmissionDetails();
  }, [id]);

  const fetchSubmissionDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/submissions/phase-i/${id}`);
      setSubmission(response.data.data.submission);
      setError(null);
    } catch (err) {
      console.error('Error fetching submission:', err);
      setError(err.response?.data?.message || 'Failed to load submission details');
      toast.error('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      SUBMITTED: 'info',
      APPROVED: 'success',
      REJECTED: 'error',
      REVISION_REQUESTED: 'warning',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (approved) => {
    if (approved === true) return <CheckCircle color="success" />;
    if (approved === false) return <Cancel color="error" />;
    return <AccessTime color="action" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !submission) {
    return (
      <Paper sx={{ p: 3 }}>
        <Alert severity="error">{error || 'Submission not found'}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/submissions')}
          sx={{ mt: 2 }}
        >
          Back to Submissions
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/submissions')}
        sx={{ mb: 2 }}
      >
        Back to Submissions
      </Button>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Phase I Submission Details
          </Typography>
          <Chip
            label={submission.status}
            color={getStatusColor(submission.status)}
            size="medium"
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Event Details */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Event Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Event Name</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {submission.eventDetails?.eventName || submission.eventId?.title || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Venue</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {submission.eventDetails?.venue || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Start Date</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {submission.eventDetails?.startDate
                    ? new Date(submission.eventDetails.startDate).toLocaleDateString()
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">End Date</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {submission.eventDetails?.endDate
                    ? new Date(submission.eventDetails.endDate).toLocaleDateString()
                    : 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Organizer</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {submission.eventDetails?.organizerName || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Registration Details */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Registration Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Participation Type</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {submission.registrationId?.participationType || 'N/A'}
                </Typography>
              </Grid>
              {submission.registrationId?.participationType === 'TEAM' && (
                <>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">Team Name</Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {submission.registrationId?.teamName || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Team Members</Typography>
                    <Box sx={{ mt: 1 }}>
                      {submission.registrationId?.teamMembers?.map((member, index) => (
                        <Chip key={index} label={member} sx={{ mr: 1, mb: 1 }} />
                      ))}
                    </Box>
                  </Grid>
                </>
              )}
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Payment Status</Typography>
                <Chip
                  label={submission.registrationId?.paymentStatus || 'N/A'}
                  color={submission.registrationId?.paymentStatus === 'PAID' ? 'success' : 'warning'}
                  size="small"
                />
              </Grid>
              {submission.registrationId?.paymentAmount && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">Payment Amount</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ₹{submission.registrationId.paymentAmount}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Approval Progress */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Approval Progress
            </Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
              {/* Advisor Approval */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ pt: 0.5 }}>
                  {getStatusIcon(submission.advisorApproval?.approved)}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <PersonOutline fontSize="small" color="action" />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Advisor
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Status: {submission.advisorApproval?.approved === true
                      ? 'Approved'
                      : submission.advisorApproval?.approved === false
                      ? 'Rejected'
                      : 'Pending'}
                  </Typography>
                  {submission.advisorApproval?.comments && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                      "{submission.advisorApproval.comments}"
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* Mentor Approval */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ pt: 0.5 }}>
                  {getStatusIcon(submission.mentorApproval?.approved)}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <PersonOutline fontSize="small" color="action" />
                    <Typography variant="subtitle2" fontWeight="bold">
                      Mentor
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Status: {submission.mentorApproval?.approved === true
                      ? 'Approved'
                      : submission.mentorApproval?.approved === false
                      ? 'Rejected'
                      : 'Pending'}
                  </Typography>
                  {submission.mentorApproval?.comments && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                      "{submission.mentorApproval.comments}"
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider />

              {/* HOD Approval */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ pt: 0.5 }}>
                  {getStatusIcon(submission.hodApproval?.approved)}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <PersonOutline fontSize="small" color="action" />
                    <Typography variant="subtitle2" fontWeight="bold">
                      HOD
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Status: {submission.hodApproval?.approved === true
                      ? 'Approved'
                      : submission.hodApproval?.approved === false
                      ? 'Rejected'
                      : 'Pending'}
                  </Typography>
                  {submission.hodApproval?.comments && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}>
                      "{submission.hodApproval.comments}"
                    </Typography>
                  )}
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Submission Date */}
        <Box mt={3} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Submitted on: {new Date(submission.submittedAt || submission.createdAt).toLocaleString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default PhaseISubmissionView;
