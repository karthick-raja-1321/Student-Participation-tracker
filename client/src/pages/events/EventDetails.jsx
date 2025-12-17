import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Button,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  CalendarToday,
  LocationOn,
  People,
  Category,
  Visibility,
  Edit,
  ArrowBack,
  Public,
  Business,
} from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    fetchEventDetails();
  }, [id]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${id}`);
      setEvent(response.data.data.event);
    } catch (error) {
      toast.error('Failed to fetch event details');
      navigate('/events');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      PUBLISHED: 'success',
      ONGOING: 'info',
      COMPLETED: 'warning',
      CANCELLED: 'error',
    };
    return colors[status] || 'default';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handleRegisterForEvent = async () => {
    try {
      // Call API to register (will check for duplicate registration)
      const response = await api.post(`/events/${id}/register`);
      toast.success('Successfully registered for the event!');
      
      // Redirect to registration link if it exists
      if (event.registrationLink) {
        setTimeout(() => {
          window.open(event.registrationLink, '_blank');
        }, 500);
      }
      
      // Refresh event data to show updated count
      fetchEventDetails();
    } catch (error) {
      if (error.response?.status === 409) {
        toast.warning('You are already registered for this event');
        // Still redirect to registration link even if already registered
        if (event.registrationLink) {
          setTimeout(() => {
            window.open(event.registrationLink, '_blank');
          }, 500);
        }
      } else {
        toast.error(error.response?.data?.message || 'Failed to register for event');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography>Event not found</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/events')}
        sx={{ mb: 2 }}
      >
        Back to Events
      </Button>

      <Paper sx={{ p: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="h4" gutterBottom>
              {event.title}
            </Typography>
            {!isStudent && (
              <Stack direction="row" spacing={1}>
                <Chip
                  label={event.status}
                  color={getStatusColor(event.status)}
                  size="medium"
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Edit />}
                  onClick={() => toast.info('Edit functionality coming soon')}
                >
                  Edit
                </Button>
              </Stack>
            )}
          </Stack>

          <Typography variant="body1" color="text.secondary" paragraph>
            {event.description}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Event Information Grid */}
        <Grid container spacing={3}>
          {/* Date & Time */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <CalendarToday color="primary" />
                  <Typography variant="h6">Date & Time</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  <strong>Start:</strong> {formatDate(event.startDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>End:</strong> {formatDate(event.endDate)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Location */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <LocationOn color="primary" />
                  <Typography variant="h6">Venue</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {event.venue}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Event Type */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Category color="primary" />
                  <Typography variant="h6">Event Type</Typography>
                </Stack>
                <Chip label={event.eventType} color="primary" variant="outlined" />
              </CardContent>
            </Card>
          </Grid>

          {/* Event Level */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Public color="primary" />
                  <Typography variant="h6">Event Level</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {event.eventLevel ? event.eventLevel.replace('_', ' ') : 'Not Specified'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Participants */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <People color="primary" />
                  <Typography variant="h6">Participants</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  <strong>Current:</strong> {event.currentParticipants || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Max:</strong> {event.maxParticipants || 'Unlimited'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Department */}
          {event.departmentId && (
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <Business color="primary" />
                    <Typography variant="h6">Department</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {event.departmentId.code} - {event.departmentId.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Visibility & Views */}
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Visibility color="primary" />
                  <Typography variant="h6">Visibility</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  <strong>Access:</strong> {event.visibility}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>Views:</strong> {event.viewCount || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Created By */}
          {event.createdBy && (
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" mb={1}>
                    Created By
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.createdBy.firstName} {event.createdBy.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.createdBy.email}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Additional Information */}
        {event.registrationDeadline && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Registration Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Registration Deadline:</strong> {formatDate(event.registrationDeadline)}
            </Typography>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          {isStudent && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleRegisterForEvent}
            >
              Register for Event
            </Button>
          )}
          {!isStudent && event.status === 'DRAFT' && (
            <Button
              variant="contained"
              color="success"
              onClick={() => toast.info('Publish feature coming soon')}
            >
              Publish Event
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default EventDetails;

