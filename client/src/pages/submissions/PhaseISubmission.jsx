import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  Snackbar,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { autoSaveFormData, getAutoSavedFormData, clearAutoSavedFormData } from '../../utils/autoSave';

const steps = ['Event Selection', 'Participation Details', 'Payment Information', 'Review & Submit'];

const validationSchema = Yup.object({
  eventId: Yup.string().required('Event is required'),
  mentorId: Yup.string().required('Mentor is required'),
  participationType: Yup.string().required('Participation type is required'),
  teamName: Yup.string().when('participationType', {
    is: 'TEAM',
    then: (schema) => schema.required('Team name is required'),
  }),
  teamMembers: Yup.array().when('participationType', {
    is: 'TEAM',
    then: (schema) => schema.min(1, 'At least one team member required'),
  }),
  paymentStatus: Yup.string().required('Payment status is required'),
  paymentAmount: Yup.number().min(0, 'Amount must be positive'),
});

const PhaseISubmission = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeStep, setActiveStep] = useState(0);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const restoredRef = useRef(false);
  const formId = 'on-duty-process-form';

  useEffect(() => {
    // Only fetch current student if user is a STUDENT
    if (user?.role === 'STUDENT') {
      fetchCurrentStudent();
    }
    fetchEvents();
    fetchStudents();
    fetchMentors();
  }, [user]);

  const fetchCurrentStudent = async () => {
    try {
      const response = await api.get('/students/me');
      setCurrentStudentId(response.data.data._id);
    } catch (err) {
      // Silently handle - user may not be a student (e.g., HOD, Faculty, Admin)
      // This is expected behavior for non-student users
      if (err.response?.status !== 404) {
        console.error('Error fetching current student:', err);
      }
    }
  };

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

  const fetchMentors = async () => {
    try {
      const response = await api.get('/faculty');
      setMentors(response.data.data.faculty || []);
    } catch (err) {
      console.error('Failed to load faculty:', err);
    }
  };

  const formik = useFormik({
    initialValues: {
      eventId: '',
      mentorId: '',
      participationType: 'INDIVIDUAL',
      teamName: '',
      teamMembers: [],
      paymentStatus: 'NOT_REQUIRED',
      paymentAmount: 0,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setLoading(true);
      try {
        // Include studentId from current logged-in student
        const submissionData = {
          ...values,
          studentId: currentStudentId,
        };
        
        if (!currentStudentId) {
          toast.error('Student profile not found. Please refresh and try again.');
          setLoading(false);
          setSubmitting(false);
          return;
        }
        
        console.log('Submitting data:', submissionData);
        const response = await api.post('/registrations', submissionData);
        toast.success(response.data?.message || 'On-Duty Process submission successful!');
        
        // Clear auto-saved data on successful submission
        clearAutoSavedFormData(formId);
        
        navigate('/submissions');
      } catch (err) {
        console.error('Submission error:', err.response?.data);
        console.error('Full error:', err);
        const errorMessage = err.response?.data?.message || 'Submission failed';
        const errors = err.response?.data?.errors;
        
        if (errors && Array.isArray(errors)) {
          errors.forEach(error => console.error('Validation error:', error));
          toast.error(`Validation failed: ${errors.map(e => e.message || e).join(', ')}`);
        } else {
          toast.error(errorMessage);
        }
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  // Restore auto-saved data once on mount - happens after formik initialization
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    
    const restoreData = async () => {
      const savedData = getAutoSavedFormData(formId);
      if (savedData) {
        // Wait a tick to ensure formik is ready
        await new Promise(resolve => setTimeout(resolve, 50));
        formik.setValues({
          eventId: savedData.eventId ?? '',
          mentorId: savedData.mentorId ?? '',
          participationType: savedData.participationType ?? 'INDIVIDUAL',
          teamName: savedData.teamName ?? '',
          teamMembers: savedData.teamMembers ?? [],
          paymentStatus: savedData.paymentStatus ?? 'NOT_REQUIRED',
          paymentAmount: savedData.paymentAmount ?? 0,
        });
        setAutoSaveStatus('restored');
        setTimeout(() => setAutoSaveStatus(''), 3000);
      }
    };
    
    restoreData();
  }, [formik]);

  // Auto-save on form changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      autoSaveFormData(
        formId,
        formik.values,
        () => setAutoSaveStatus('saved')
      );
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [formik.values]);

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

            <TextField
              fullWidth
              select
              label="Select Mentor (Faculty)"
              name="mentorId"
              value={formik.values.mentorId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.mentorId && Boolean(formik.errors.mentorId)}
              helperText={formik.touched.mentorId && formik.errors.mentorId}
              sx={{ mb: 2 }}
            >
              {mentors.map((mentor) => (
                <MenuItem key={mentor._id} value={mentor._id}>
                  {mentor.firstName} {mentor.lastName} - {mentor.employeeId || 'N/A'} - {mentor.departmentId?.name || 'Department'}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        );

      case 1:
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
              <MenuItem value="INDIVIDUAL">Individual</MenuItem>
              <MenuItem value="TEAM">Team</MenuItem>
            </TextField>

            {formik.values.participationType === 'TEAM' && (
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
              label="Payment Status"
              name="paymentStatus"
              value={formik.values.paymentStatus}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.paymentStatus && Boolean(formik.errors.paymentStatus)}
              helperText={formik.touched.paymentStatus && formik.errors.paymentStatus}
              sx={{ mb: 2 }}
            >
              <MenuItem value="NOT_REQUIRED">Not Required</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="PAID">Paid</MenuItem>
            </TextField>

            <TextField
              fullWidth
              type="number"
              label="Payment Amount (₹)"
              name="paymentAmount"
              value={formik.values.paymentAmount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.paymentAmount && Boolean(formik.errors.paymentAmount)}
              helperText={formik.touched.paymentAmount && formik.errors.paymentAmount}
              inputProps={{ min: 0 }}
              sx={{ mb: 2 }}
            />
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
                <strong>Participation Type:</strong> {formik.values.participationType}
              </Typography>
              {formik.values.participationType === 'TEAM' && (
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
                <strong>Payment Amount:</strong> ₹{formik.values.paymentAmount}
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            On-Duty Process
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Pre-Event Registration & Approval
          </Typography>
        </Box>
        {autoSaveStatus && (
          <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
            ✓ {autoSaveStatus === 'saved' ? 'Auto-saved' : 'Form restored from previous session'}
          </Typography>
        )}
      </Box>

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

      <Snackbar
        open={autoSaveStatus === 'saved'}
        autoHideDuration={3000}
        onClose={() => setAutoSaveStatus('')}
        message="Form auto-saved"
      />
    </Paper>
  );
};

export default PhaseISubmission;
