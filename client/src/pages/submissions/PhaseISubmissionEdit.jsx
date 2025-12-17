import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const validationSchema = Yup.object({
  eventId: Yup.string().required('Event is required'),
  mentorId: Yup.string().required('Mentor is required'),
  teamName: Yup.string(),
  eventDetails: Yup.object({
    eventName: Yup.string().required('Event name is required'),
    venue: Yup.string().required('Venue is required'),
    organizerName: Yup.string().required('Organizer name is required'),
    startDate: Yup.date().required('Start date is required'),
    endDate: Yup.date().required('End date is required'),
  }),
});

const PhaseISubmissionEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [students, setStudents] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [submissionRes, eventsRes, mentorsRes, studentsRes] = await Promise.all([
        api.get(`/submissions/phase-i/${id}`),
        api.get('/events'),
        api.get('/faculty'),
        api.get('/students'),
      ]);

      const submissionData = submissionRes.data.data.submission;
      setSubmission(submissionData);
      setEvents(eventsRes.data.data.events || []);
      setMentors(mentorsRes.data.data.faculty || []);
      setStudents(studentsRes.data.data.students || []);

      // Check if user can edit
      const isStudent = user?.role === 'STUDENT';
      const canStudentEdit = isStudent && (!submissionData.mentorApproval || submissionData.mentorApproval.approved === null);
      const canAdminEdit = !isStudent;
      setCanEdit(canStudentEdit || canAdminEdit);

      // Initialize form with existing data
      formik.setValues({
        eventId: submissionData.eventId?._id || '',
        mentorId: submissionData.mentorId?._id || '',
        teamName: submissionData.teamName || '',
        teamMembers: submissionData.teamMembers || [],
        eventDetails: {
          eventName: submissionData.eventDetails?.eventName || '',
          venue: submissionData.eventDetails?.venue || '',
          organizerName: submissionData.eventDetails?.organizerName || '',
          startDate: submissionData.eventDetails?.startDate ? 
            new Date(submissionData.eventDetails.startDate).toISOString().split('T')[0] : '',
          endDate: submissionData.eventDetails?.endDate ? 
            new Date(submissionData.eventDetails.endDate).toISOString().split('T')[0] : '',
        },
      });
    } catch (error) {
      toast.error('Failed to load submission data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      eventId: '',
      mentorId: '',
      teamName: '',
      teamMembers: [],
      eventDetails: {
        eventName: '',
        venue: '',
        organizerName: '',
        startDate: '',
        endDate: '',
      },
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setSaving(true);
        await api.put(`/submissions/phase-i/${id}`, values);
        toast.success('Submission updated successfully');
        navigate('/submissions');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to update submission');
      } finally {
        setSaving(false);
      }
    },
  });

  const handleAddTeamMember = () => {
    const newMember = { studentId: '', rollNumber: '', name: '' };
    formik.setFieldValue('teamMembers', [...formik.values.teamMembers, newMember]);
  };

  const handleRemoveTeamMember = (index) => {
    const updatedMembers = formik.values.teamMembers.filter((_, i) => i !== index);
    formik.setFieldValue('teamMembers', updatedMembers);
  };

  const handleTeamMemberChange = (index, field, value) => {
    const updatedMembers = [...formik.values.teamMembers];
    updatedMembers[index][field] = value;
    
    if (field === 'studentId') {
      const student = students.find(s => s._id === value);
      if (student) {
        updatedMembers[index].rollNumber = student.rollNumber;
        updatedMembers[index].name = `${student.userId?.firstName} ${student.userId?.lastName}`;
      }
    }
    
    formik.setFieldValue('teamMembers', updatedMembers);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!canEdit) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          You cannot edit this submission as it has already been approved or rejected by the mentor.
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/submissions')} sx={{ mt: 2 }}>
          Back to Submissions
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/submissions')}>
          Back
        </Button>
        <Typography variant="h4">Edit Submission</Typography>
      </Box>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          {/* Event Selection */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Event Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Select Event"
                      name="eventId"
                      value={formik.values.eventId}
                      onChange={formik.handleChange}
                      error={formik.touched.eventId && Boolean(formik.errors.eventId)}
                      helperText={formik.touched.eventId && formik.errors.eventId}
                    >
                      {events.map((event) => (
                        <MenuItem key={event._id} value={event._id}>
                          {event.title} - {event.eventType}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Select Mentor"
                      name="mentorId"
                      value={formik.values.mentorId}
                      onChange={formik.handleChange}
                      error={formik.touched.mentorId && Boolean(formik.errors.mentorId)}
                      helperText={formik.touched.mentorId && formik.errors.mentorId}
                    >
                      {mentors.map((mentor) => (
                        <MenuItem key={mentor._id} value={mentor._id}>
                          {mentor.firstName} {mentor.lastName} - {mentor.employeeId} - {mentor.departmentId?.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Event Name"
                      name="eventDetails.eventName"
                      value={formik.values.eventDetails.eventName}
                      onChange={formik.handleChange}
                      error={formik.touched.eventDetails?.eventName && Boolean(formik.errors.eventDetails?.eventName)}
                      helperText={formik.touched.eventDetails?.eventName && formik.errors.eventDetails?.eventName}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Venue"
                      name="eventDetails.venue"
                      value={formik.values.eventDetails.venue}
                      onChange={formik.handleChange}
                      error={formik.touched.eventDetails?.venue && Boolean(formik.errors.eventDetails?.venue)}
                      helperText={formik.touched.eventDetails?.venue && formik.errors.eventDetails?.venue}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Organizer Name"
                      name="eventDetails.organizerName"
                      value={formik.values.eventDetails.organizerName}
                      onChange={formik.handleChange}
                      error={formik.touched.eventDetails?.organizerName && Boolean(formik.errors.eventDetails?.organizerName)}
                      helperText={formik.touched.eventDetails?.organizerName && formik.errors.eventDetails?.organizerName}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Start Date"
                      name="eventDetails.startDate"
                      value={formik.values.eventDetails.startDate}
                      onChange={formik.handleChange}
                      InputLabelProps={{ shrink: true }}
                      error={formik.touched.eventDetails?.startDate && Boolean(formik.errors.eventDetails?.startDate)}
                      helperText={formik.touched.eventDetails?.startDate && formik.errors.eventDetails?.startDate}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      type="date"
                      label="End Date"
                      name="eventDetails.endDate"
                      value={formik.values.eventDetails.endDate}
                      onChange={formik.handleChange}
                      InputLabelProps={{ shrink: true }}
                      error={formik.touched.eventDetails?.endDate && Boolean(formik.errors.eventDetails?.endDate)}
                      helperText={formik.touched.eventDetails?.endDate && formik.errors.eventDetails?.endDate}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Team Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Team Information (Optional)
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <TextField
                  fullWidth
                  label="Team Name"
                  name="teamName"
                  value={formik.values.teamName}
                  onChange={formik.handleChange}
                  sx={{ mb: 2 }}
                />

                {formik.values.teamMembers.map((member, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          select
                          fullWidth
                          label="Student"
                          value={member.studentId}
                          onChange={(e) => handleTeamMemberChange(index, 'studentId', e.target.value)}
                        >
                          {students.map((student) => (
                            <MenuItem key={student._id} value={student._id}>
                              {student.rollNumber} - {student.userId?.firstName} {student.userId?.lastName}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" gap={1}>
                          <TextField
                            fullWidth
                            label="Roll Number"
                            value={member.rollNumber}
                            disabled
                          />
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={() => handleRemoveTeamMember(index)}
                          >
                            Remove
                          </Button>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                ))}

                <Button variant="outlined" onClick={handleAddTeamMember}>
                  Add Team Member
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/submissions')}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                disabled={saving}
              >
                Save Changes
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default PhaseISubmissionEdit;
