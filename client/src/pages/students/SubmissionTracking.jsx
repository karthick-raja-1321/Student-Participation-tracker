import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  CircularProgress,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import { CheckCircle, Pending, Cancel, ArrowBack } from '@mui/icons-material';
import api from '../../utils/api';

const SubmissionTracking = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/students/submissions/${submissionId}/tracking`);
        if (response.data.status === 'success') {
          setTrackingData(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch tracking data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, [submissionId]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'APPROVED':
        return <CheckCircle color="success" />;
      case 'PENDING':
        return <Pending color="warning" />;
      case 'REJECTED':
        return <Cancel color="error" />;
      default:
        return <Pending color="disabled" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Typography color="error">Failed to load tracking data: {error}</Typography>
      </Box>
    );
  }

  const { submission, student, hod, approvalStages, isOnDuty, onDutyApprovalStatus } = trackingData || {};

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        Submission Tracking
      </Typography>

      {/* Submission Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Event Details
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Event Title</Typography>
            <Typography variant="body1">{submission?.eventId?.title}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Event Dates</Typography>
            <Typography variant="body1">
              {new Date(submission?.eventId?.startDate).toLocaleDateString()} - {' '}
              {new Date(submission?.eventId?.endDate).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Location</Typography>
            <Typography variant="body1">{submission?.eventId?.location}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">On-Duty Status</Typography>
            <Chip 
              label={isOnDuty ? 'On-Duty' : 'Not On-Duty'} 
              color={isOnDuty ? 'primary' : 'default'} 
              size="small"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Approval Stages */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Approval Progress
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Stepper orientation="vertical">
          {approvalStages?.map((stage, index) => (
            <Step key={index} active={stage.status === 'PENDING'} completed={stage.status === 'COMPLETED' || stage.status === 'APPROVED'}>
              <StepLabel
                StepIconComponent={() => getStatusIcon(stage.status)}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1">{stage.stage}</Typography>
                  <Chip 
                    label={stage.status} 
                    color={getStatusColor(stage.status)} 
                    size="small"
                  />
                </Box>
              </StepLabel>
              <StepContent>
                <Box sx={{ pl: 2 }}>
                  {stage.completedAt && (
                    <Typography variant="body2" color="text.secondary">
                      Completed: {new Date(stage.completedAt).toLocaleString()}
                    </Typography>
                  )}
                  {stage.approvedBy && (
                    <Typography variant="body2" color="text.secondary">
                      Approved by: {stage.approvedBy.firstName} {stage.approvedBy.lastName}
                    </Typography>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* OD Receipt Download */}
      {isOnDuty && onDutyApprovalStatus === 'APPROVED' && (
        <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.light' }}>
          <Typography variant="h6" gutterBottom>
            On-Duty Approval Certificate
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Your on-duty request has been approved. You can download the approval certificate below.
          </Typography>
          <Button
            variant="contained"
            color="success"
            onClick={() => navigate(`/students/submissions/${submissionId}/receipt`)}
          >
            Download OD Certificate (PDF)
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default SubmissionTracking;
