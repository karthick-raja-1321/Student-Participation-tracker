import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Grid,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const validationSchema = Yup.object({
  phaseISubmissionId: Yup.string().required('Phase I submission is required'),
  actualParticipationDate: Yup.date().required('Participation date is required'),
  result: Yup.string().required('Result is required'),
  prizeWon: Yup.string(),
  prizeAmount: Yup.number().min(0, 'Prize amount must be positive'),
  eventReport: Yup.string()
    .required('Event report is required')
    .min(100, 'Report must be at least 100 characters'),
});

const PhaseIISubmission = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [phaseISubmissions, setPhaseISubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    fetchPhaseISubmissions();
    if (id) {
      formik.setFieldValue('phaseISubmissionId', id);
    }
  }, [id]);

  const fetchPhaseISubmissions = async () => {
    try {
      const response = await api.get('/phase-i');
      setPhaseISubmissions(response.data.data.submissions || []);
    } catch (err) {
      console.error('Failed to load Phase I submissions:', err);
    }
  };

  const formik = useFormik({
    initialValues: {
      phaseISubmissionId: id || '',
      actualParticipationDate: '',
      result: '',
      prizeWon: '',
      prizeAmount: 0,
      eventReport: '',
      certificateUrls: [],
      photoUrls: [],
      geoLocation: {
        latitude: 0,
        longitude: 0,
        address: '',
      },
      feedback: '',
      learningOutcomes: '',
      hasCertificate: false,
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setLoading(true);
      try {
        // In a real implementation, you would upload files first
        const payload = {
          ...values,
          certificateUrls: certificates.map((c) => c.url || ''),
        };

        await api.post('/phase-ii', payload);
        toast.success('Phase II submission successful!');
        navigate('/submissions');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Submission failed');
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  const handleFileUpload = (event, type) => {
    const files = Array.from(event.target.files);
    // In a real implementation, upload to server/S3
    toast.info('File upload feature will be implemented with cloud storage');
    console.log('Files to upload:', files);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          formik.setFieldValue('geoLocation.latitude', position.coords.latitude);
          formik.setFieldValue('geoLocation.longitude', position.coords.longitude);
          formik.setFieldValue(
            'geoLocation.address',
            `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`
          );
          toast.success('Location captured!');
        },
        (error) => {
          toast.error('Failed to get location');
        }
      );
    } else {
      toast.error('Geolocation not supported');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Phase II Submission
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Post-Event Participation Report
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Complete this form within 14 days of event participation to avoid overdue status
      </Alert>

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Phase I Submission"
              name="phaseISubmissionId"
              value={formik.values.phaseISubmissionId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.phaseISubmissionId && Boolean(formik.errors.phaseISubmissionId)
              }
              helperText={formik.touched.phaseISubmissionId && formik.errors.phaseISubmissionId}
            >
              {phaseISubmissions.map((submission) => (
                <MenuItem key={submission._id} value={submission._id}>
                  {submission.eventId?.title || 'Event'} - {submission.registrationType}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Actual Participation Date"
              name="actualParticipationDate"
              value={formik.values.actualParticipationDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.actualParticipationDate &&
                Boolean(formik.errors.actualParticipationDate)
              }
              helperText={
                formik.touched.actualParticipationDate && formik.errors.actualParticipationDate
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Result"
              name="result"
              value={formik.values.result}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.result && Boolean(formik.errors.result)}
              helperText={formik.touched.result && formik.errors.result}
            >
              <MenuItem value="PARTICIPATED">Participated</MenuItem>
              <MenuItem value="WINNER">Winner</MenuItem>
              <MenuItem value="RUNNER_UP">Runner Up</MenuItem>
              <MenuItem value="FINALIST">Finalist</MenuItem>
              <MenuItem value="PARTICIPATION_CERTIFICATE">Participation Certificate</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Prize Won (if any)"
              name="prizeWon"
              value={formik.values.prizeWon}
              onChange={formik.handleChange}
              placeholder="e.g., First Prize, Best Paper Award"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Prize Amount (₹)"
              name="prizeAmount"
              value={formik.values.prizeAmount}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.prizeAmount && Boolean(formik.errors.prizeAmount)}
              helperText={formik.touched.prizeAmount && formik.errors.prizeAmount}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Event Report"
              name="eventReport"
              value={formik.values.eventReport}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.eventReport && Boolean(formik.errors.eventReport)}
              helperText={
                (formik.touched.eventReport && formik.errors.eventReport) ||
                `${formik.values.eventReport.length} characters (minimum 100)`
              }
              placeholder="Describe your experience, what you learned, and how it benefited you..."
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Learning Outcomes"
              name="learningOutcomes"
              value={formik.values.learningOutcomes}
              onChange={formik.handleChange}
              placeholder="What skills or knowledge did you gain from this event?"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Feedback"
              name="feedback"
              value={formik.values.feedback}
              onChange={formik.handleChange}
              placeholder="Any feedback about the event or suggestions for improvement?"
            />
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formik.values.hasCertificate}
                  onChange={formik.handleChange}
                  name="hasCertificate"
                />
              }
              label="I have received a certificate"
            />
          </Grid>

          {formik.values.hasCertificate && (
            <Grid item xs={12}>
              <Typography variant="body2" gutterBottom>
                Upload Certificate(s)
              </Typography>
              <Button variant="outlined" component="label">
                Choose Files
                <input
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  id="certificate-upload"
                  name="certificateFiles"
                  onChange={(e) => handleFileUpload(e, 'certificate')}
                />
              </Button>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Accepted formats: PDF, JPG, PNG (Max 5MB each)
              </Typography>
            </Grid>
          )}

          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>
              Upload Event Photos
            </Typography>
            <Button variant="outlined" component="label">
              Choose Photos
              <input
                type="file"
                hidden
                multiple
                accept=".jpg,.jpeg,.png"
                id="photo-upload"
                name="photoFiles"
                onChange={(e) => handleFileUpload(e, 'photo')}
              />
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Upload photos from the event (with GPS metadata if possible)
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2">
                Location: {formik.values.geoLocation.address || 'Not captured'}
              </Typography>
              <Button variant="outlined" size="small" onClick={handleGetLocation}>
                Get Current Location
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button onClick={() => navigate('/submissions')}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={formik.isSubmitting || loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Submit Phase II'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default PhaseIISubmission;
