import React, { useState, useEffect, useRef } from 'react';
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
  Snackbar,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { autoSaveFormData, getAutoSavedFormData, clearAutoSavedFormData } from '../../utils/autoSave';

const validationSchema = Yup.object({
  phaseISubmissionId: Yup.string().required('Phase I submission is required'),
  actualParticipationDate: Yup.date().required('Participation date is required'),
  result: Yup.string()
    .required('Result is required')
    .oneOf(['PARTICIPATED', 'WINNER', 'RUNNER_UP', 'FINALIST'], 'Invalid result selected'),
  prizeWon: Yup.string(),
  prizeAmount: Yup.number().min(0, 'Prize amount must be positive'),
  certificate: Yup.mixed().required('Certificate is required'),
  eventReport: Yup.mixed().required('Event report file is required'),
  photoFiles: Yup.mixed(),
});

const PhaseIISubmission = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [phaseISubmissions, setPhaseISubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const restoredRef = useRef(false);
  const formId = 'event-participation-proof-form';

  useEffect(() => {
    fetchPhaseISubmissions();
  }, []);

  const fetchPhaseISubmissions = async () => {
    try {
      const response = await api.get('/submissions/phase-i');
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
      certificate: null,
      eventReport: null,
      photoFiles: null,
      geoLocation: {
        latitude: 0,
        longitude: 0,
        address: '',
      },
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
        toast.success('Event Participation Proof submission successful!');
        
        // Clear auto-saved data on successful submission
        clearAutoSavedFormData(formId);
        
        navigate('/submissions');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Submission failed');
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  // Restore auto-saved data once on mount
  useEffect(() => {
    if (restoredRef.current) return;
    const savedData = getAutoSavedFormData(formId);
    if (savedData) {
      // Only restore phaseISubmissionId if it exists in the available submissions
      const submissionExists = phaseISubmissions.some(
        (sub) => sub._id === savedData.phaseISubmissionId
      );
      
      const dataToRestore = {
        ...savedData,
        phaseISubmissionId: submissionExists ? savedData.phaseISubmissionId : (id || ''),
      };
      
      formik.setValues((prev) => ({ ...prev, ...dataToRestore }));
      setAutoSaveStatus('restored');
      restoredRef.current = true;
      setTimeout(() => setAutoSaveStatus(''), 3000);
    }
  }, [phaseISubmissions]);

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

  const handleFileUpload = (event, type) => {
    const files = Array.from(event.target.files);
    // In a real implementation, upload to server/S3
    toast.info('File upload feature will be implemented with cloud storage');
    console.log('Files to upload:', files);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Event Participation Proof
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Post-Event Participation Report & Proof of Participation
          </Typography>
        </Box>
        {autoSaveStatus && (
          <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
            ✓ {autoSaveStatus === 'saved' ? 'Auto-saved' : 'Form restored from previous session'}
          </Typography>
        )}
      </Box>

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
              <MenuItem value="">-- Select Phase I Submission --</MenuItem>
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
            <Typography variant="body2" gutterBottom>
              Event Report <span style={{ color: 'red' }}>*</span>
            </Typography>
            <Button variant="outlined" component="label">
              Choose Event Report File
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx,.txt"
                name="eventReport"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    formik.setFieldValue('eventReport', file);
                  }
                }}
                onBlur={formik.handleBlur}
              />
            </Button>
            {formik.values.eventReport && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                File: {formik.values.eventReport.name}
              </Typography>
            )}
            {formik.touched.eventReport && formik.errors.eventReport && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                {formik.errors.eventReport}
              </Typography>
            )}
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Accepted formats: PDF, DOC, DOCX, TXT (Max 5MB)
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>
              Certificate <span style={{ color: 'red' }}>*</span>
            </Typography>
            <Button variant="outlined" component="label">
              Choose Certificate File
              <input
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                name="certificate"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    formik.setFieldValue('certificate', file);
                  }
                }}
                onBlur={formik.handleBlur}
              />
            </Button>
            {formik.values.certificate && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                File: {formik.values.certificate.name}
              </Typography>
            )}
            {formik.touched.certificate && formik.errors.certificate && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                {formik.errors.certificate}
              </Typography>
            )}
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Accepted formats: PDF, JPG, PNG (Max 5MB)
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" gutterBottom>
              Photos
            </Typography>
            <Button variant="outlined" component="label">
              Choose Photo Files
              <input
                type="file"
                hidden
                multiple
                accept=".jpg,.jpeg,.png"
                name="photoFiles"
                onChange={(e) => {
                  const files = e.target.files?.[0];
                  if (files) {
                    formik.setFieldValue('photoFiles', files);
                  }
                }}
                onBlur={formik.handleBlur}
              />
            </Button>
            {formik.values.photoFiles && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                File: {formik.values.photoFiles.name}
              </Typography>
            )}
            {formik.touched.photoFiles && formik.errors.photoFiles && (
              <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                {formik.errors.photoFiles}
              </Typography>
            )}
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Upload photos from the event (JPG, PNG formats, Max 5MB each)
            </Typography>
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
                {loading ? <CircularProgress size={24} /> : 'Submit Participation Proof'}
              </Button>
            </Box>
          </Grid>
        </Grid>
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

export default PhaseIISubmission;
