import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Box,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Chip,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const steps = ['Event Selection', 'Registration Details', 'Participation Info', 'Review & Submit'];

const validationSchema = Yup.object({
  eventId: Yup.string().required('Event is required'),
  registrationType: Yup.string().required('Registration type is required'),
  teamName: Yup.string().when('registrationType', {
    is: 'TEAM',
    then: (schema) => schema.required('Team name is required'),
  }),
  teamMembers: Yup.array().when('registrationType', {
    is: 'TEAM',
    then: (schema) => schema.min(1, 'At least one team member required'),
  }),
  participationType: Yup.string().required('Participation type is required'),
  registrationFee: Yup.number().min(0, 'Fee must be positive'),
  paymentStatus: Yup.string().required('Payment status is required'),
  transactionId: Yup.string().when('paymentStatus', {
    is: 'PAID',
    then: (schema) => schema.required('Transaction ID required for paid status'),
  }),
});

const PhaseISubmission = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchStudents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data.data.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const formik = useFormik({
    initialValues: {
      eventId: '',
      registrationType: 'INDIVIDUAL',
      teamName: '',
      teamMembers: [],
      participationType: 'OFFLINE',
      registrationFee: 0,
      paymentStatus: 'UNPAID',
      transactionId: '',
      registrationDate: new Date().toISOString().split('T')[0],
      expectedParticipationDate: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setLoading(true);
      try {
        await api.post('/registrations', values);
        toast.success('Phase I submission successful!');
        navigate('/submissions');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Submission failed');
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              fullWidth
              select
              label="Select Event"
              name="eventId"
              value={formik.values.eventId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.eventId && Boolean(formik.errors.eventId)}
              helperText={formik.touched.eventId && formik.errors.eventId}
              sx={{ mb: 2 }}
            >
              {events.map((event) => (
                <MenuItem key={event._id} value={event._id}>
                  {event.title} - {event.eventType}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              type="date"
              label="Expected Participation Date"
              name="expectedParticipationDate"
              value={formik.values.expectedParticipationDate}
              onChange={formik.handleChange}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <TextField
              fullWidth
              select
              label="Registration Type"
              name="registrationType"
              value={formik.values.registrationType}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.registrationType && Boolean(formik.errors.registrationType)}
              helperText={formik.touched.registrationType && formik.errors.registrationType}
              sx={{ mb: 2 }}
            >
              <MenuItem value="INDIVIDUAL">Individual</MenuItem>
              <MenuItem value="TEAM">Team</MenuItem>
            </TextField>

            {formik.values.registrationType === 'TEAM' && (
              <>
                <TextField
                  fullWidth
                  label="Team Name"
                  name="teamName"
                  value={formik.values.teamName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.teamName && Boolean(formik.errors.teamName)}
                  helperText={formik.touched.teamName && formik.errors.teamName}
                  sx={{ mb: 2 }}
                />

                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="team-members-label">Team Members</InputLabel>
                  <Select
                    labelId="team-members-label"
                    id="team-members"
                    multiple
                    name="teamMembers"
                    value={formik.values.teamMembers}
                    onChange={formik.handleChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const student = students.find((s) => s._id === value);
                          return (
                            <Chip
                              key={value}
                              label={student ? `${student.firstName} ${student.lastName}` : value}
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {students.map((student) => (
                      <MenuItem key={student._id} value={student._id}>
                        {student.firstName} {student.lastName} - {student.registerNumber}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <TextField
              fullWidth
              select
              label="Participation Type"
              name="participationType"
              value={formik.values.participationType}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.participationType && Boolean(formik.errors.participationType)}
              helperText={formik.touched.participationType && formik.errors.participationType}
              sx={{ mb: 2 }}
            >
              <MenuItem value="OFFLINE">Offline</MenuItem>
              <MenuItem value="ONLINE">Online</MenuItem>
              <MenuItem value="HYBRID">Hybrid</MenuItem>
            </TextField>

            <TextField
              fullWidth
              type="number"
              label="Registration Fee"
              name="registrationFee"
              value={formik.values.registrationFee}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.registrationFee && Boolean(formik.errors.registrationFee)}
              helperText={formik.touched.registrationFee && formik.errors.registrationFee}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              select
              label="Payment Status"
              name="paymentStatus"
              value={formik.values.paymentStatus}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.paymentStatus && Boolean(formik.errors.paymentStatus)}
              helperText={formik.touched.paymentStatus && formik.errors.paymentStatus}
              sx={{ mb: 2 }}
            >
              <MenuItem value="UNPAID">Unpaid</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
              <MenuItem value="WAIVED">Waived</MenuItem>
            </TextField>

            {formik.values.paymentStatus === 'PAID' && (
              <TextField
                fullWidth
                label="Transaction ID"
                name="transactionId"
                value={formik.values.transactionId}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.transactionId && Boolean(formik.errors.transactionId)}
                helperText={formik.touched.transactionId && formik.errors.transactionId}
                sx={{ mb: 2 }}
              />
            )}
          </Box>
        );

      case 3:
        const selectedEvent = events.find((e) => e._id === formik.values.eventId);
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Submission
            </Typography>
            <Alert severity="info" sx={{ mb: 2 }}>
              Please review all details before submitting
            </Alert>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body1">
                <strong>Event:</strong> {selectedEvent?.title || 'N/A'}
              </Typography>
              <Typography variant="body1">
                <strong>Registration Type:</strong> {formik.values.registrationType}
              </Typography>
              {formik.values.registrationType === 'TEAM' && (
                <>
                  <Typography variant="body1">
                    <strong>Team Name:</strong> {formik.values.teamName}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Team Members:</strong> {formik.values.teamMembers.length}
                  </Typography>
                </>
              )}
              <Typography variant="body1">
                <strong>Participation Type:</strong> {formik.values.participationType}
              </Typography>
              <Typography variant="body1">
                <strong>Registration Fee:</strong> ₹{formik.values.registrationFee}
              </Typography>
              <Typography variant="body1">
                <strong>Payment Status:</strong> {formik.values.paymentStatus}
              </Typography>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Phase I Submission
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Pre-Event Registration
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <form onSubmit={formik.handleSubmit}>
        {renderStepContent(activeStep)}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={formik.isSubmitting || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Submit'}
              </Button>
            )}
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default PhaseISubmission;
