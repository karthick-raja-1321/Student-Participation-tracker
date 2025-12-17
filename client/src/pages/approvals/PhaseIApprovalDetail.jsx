import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  Chip,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Cancel as RejectIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const PhaseIApprovalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromHod = location.state?.fromHod === true;
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/submissions/phase-i/${id}`);
      setSubmission(response.data.data.submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      toast.error('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = () => {
    setActionType('approve');
    setComments('');
    setOpenDialog(true);
  };

  const handleRejectClick = () => {
    setActionType('reject');
    setComments('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setComments('');
    setActionType('');
  };

  const handleSubmitAction = async () => {
    if (actionType === 'reject' && !comments.trim()) {
      toast.error('Please add your rejection reason');
      return;
    }

    const stage = submission?.currentApprovalStage;
    const config = (() => {
      if (fromHod && submission?.hodApproval !== undefined) {
        return { endpoint: `/submissions/phase-i/${id}/hod-approval`, approvalField: 'hodApproval' };
      }
      switch (stage) {
        case 'ADVISOR':
          return { endpoint: `/submissions/phase-i/${id}/advisor-approval`, approvalField: 'advisorApproval' };
        case 'INNOVATION_COORDINATOR':
          return { endpoint: `/submissions/phase-i/${id}/innovation-coordinator-approval`, approvalField: 'innovationCoordinatorApproval' };
        case 'HOD':
          return { endpoint: `/submissions/phase-i/${id}/hod-approval`, approvalField: 'hodApproval' };
        case 'PRINCIPAL':
          return { endpoint: `/submissions/phase-i/${id}/principal-approval`, approvalField: 'principalApproval' };
        case 'CLASS_ADVISOR':
          return { endpoint: `/submissions/phase-i/${id}/class-advisor-approval`, approvalField: 'classAdvisorApproval' };
        case 'MENTOR':
        default:
          return { endpoint: `/submissions/phase-i/${id}/mentor-approval`, approvalField: 'mentorApproval' };
      }
    })();

    if (!config?.endpoint) {
      toast.error('Unsupported approval stage for this submission');
      return;
    }

    try {
      setSubmitting(true);

      await api.post(config.endpoint, {
        approved: actionType === 'approve',
        comments: comments.trim() || undefined,
      });

      toast.success(`Submission ${actionType === 'approve' ? 'approved' : 'rejected'} successfully`);
      handleCloseDialog();
      navigate(fromHod ? '/approvals' : '/mentorship');
    } catch (error) {
      console.error('Error submitting action:', error);
      toast.error(error.response?.data?.message || `Failed to ${actionType} submission`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!submission) {
    return (
      <Box p={3}>
        <Alert severity="error">Submission not found</Alert>
        <Button startIcon={<BackIcon />} onClick={() => navigate('/mentorship')} sx={{ mt: 2 }}>
          Back to Mentorship
        </Button>
      </Box>
    );
  }

  const getStatusChip = () => {
    const stage = submission.currentApprovalStage;
    const statusFieldMap = {
      ADVISOR: 'advisorApproval',
      CLASS_ADVISOR: 'classAdvisorApproval',
      MENTOR: 'mentorApproval',
      INNOVATION_COORDINATOR: 'innovationCoordinatorApproval',
      HOD: 'hodApproval',
      PRINCIPAL: 'principalApproval'
    };

    const field = fromHod ? 'hodApproval' : (statusFieldMap[stage] || 'mentorApproval');
    const status = submission[field];

    if (status?.approved === true) {
      return <Chip label="Approved" color="success" icon={<CheckIcon />} />;
    } else if (status?.approved === false) {
      return <Chip label="Rejected" color="error" icon={<RejectIcon />} />;
    }
    return <Chip label="Pending Approval" color="warning" />;
  };

  const canApprove = (() => {
    if (fromHod && submission?.hodApproval !== undefined) {
      return submission.hodApproval?.approved === undefined || submission.hodApproval?.approved === null;
    }

    const stage = submission.currentApprovalStage;
    const stageFieldMap = {
      ADVISOR: 'advisorApproval',
      CLASS_ADVISOR: 'classAdvisorApproval',
      MENTOR: 'mentorApproval',
      INNOVATION_COORDINATOR: 'innovationCoordinatorApproval',
      HOD: 'hodApproval',
      PRINCIPAL: 'principalApproval'
    };
    const field = stageFieldMap[stage];
    if (!field) return false;
    const approvalState = submission[field];
    return approvalState?.approved === undefined || approvalState?.approved === null;
  })();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<BackIcon />} onClick={() => navigate(fromHod ? '/approvals' : '/mentorship')}>
            Back
          </Button>
          <Typography variant="h4">Review Submission</Typography>
        </Box>
        {getStatusChip()}
      </Box>

      <Grid container spacing={3}>
        {/* Student Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Student Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="textSecondary">Name</Typography>
              <Typography variant="body1" gutterBottom>
                {submission.studentId?.userId?.firstName} {submission.studentId?.userId?.lastName}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Roll Number</Typography>
              <Typography variant="body1" gutterBottom>
                {submission.studentId?.rollNumber || submission.studentId?.registerNumber}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Email</Typography>
              <Typography variant="body1" gutterBottom>
                {submission.studentId?.userId?.email}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Department</Typography>
              <Typography variant="body1">
                {submission.departmentId?.name}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Event Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Event Information
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="textSecondary">Event Name</Typography>
              <Typography variant="body1" gutterBottom>
                {submission.eventId?.title || submission.eventDetails?.eventName}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Event Type</Typography>
              <Typography variant="body1" gutterBottom>
                {submission.eventId?.eventType || 'N/A'}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Venue</Typography>
              <Typography variant="body1" gutterBottom>
                {submission.eventDetails?.venue || 'N/A'}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Organizer</Typography>
              <Typography variant="body1" gutterBottom>
                {submission.eventDetails?.organizerName || 'N/A'}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Event Date</Typography>
              <Typography variant="body1" gutterBottom>
                {submission.eventDetails?.startDate 
                  ? `${new Date(submission.eventDetails.startDate).toLocaleDateString()} - ${new Date(submission.eventDetails.endDate).toLocaleDateString()}`
                  : 'N/A'}
              </Typography>
              
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Submitted On</Typography>
              <Typography variant="body1">
                {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Participation Details */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Participation Details
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary">Participation Type</Typography>
                  <Typography variant="body1" gutterBottom>
                    {submission.teamName ? 'Team' : 'Individual'}
                  </Typography>
                </Grid>
                
                {submission.teamName && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="textSecondary">Team Name</Typography>
                      <Typography variant="body1" gutterBottom>
                        {submission.teamName}
                      </Typography>
                    </Grid>
                    
                    {submission.teamMembers && submission.teamMembers.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Team Members</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {submission.teamMembers.map((member, index) => (
                            <Chip
                              key={index}
                              label={`${member.name || 'N/A'} (${member.rollNumber || 'N/A'})`}
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Uploaded Documents */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Uploaded Documents
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                {submission.selectionProof?.fileUrl && (
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="body2" color="textSecondary">Selection Proof</Typography>
                      <Typography variant="body1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                        {submission.selectionProof.fileName || 'Document'}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        href={submission.selectionProof.fileUrl}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        View Document
                      </Button>
                    </Box>
                  </Grid>
                )}
                
                {submission.paymentProof?.fileUrl && (
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="body2" color="textSecondary">Payment Proof</Typography>
                      <Typography variant="body1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                        {submission.paymentProof.fileName || 'Document'}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        href={submission.paymentProof.fileUrl}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        View Document
                      </Button>
                    </Box>
                  </Grid>
                )}
                
                {submission.odRequestForm?.fileUrl && (
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Typography variant="body2" color="textSecondary">OD Request Form</Typography>
                      <Typography variant="body1" gutterBottom sx={{ fontSize: '0.9rem' }}>
                        {submission.odRequestForm.fileName || 'Document'}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        href={submission.odRequestForm.fileUrl}
                        target="_blank"
                        sx={{ mt: 1 }}
                      >
                        View Document
                      </Button>
                    </Box>
                  </Grid>
                )}
              </Grid>
              
              {!submission.selectionProof?.fileUrl && !submission.paymentProof?.fileUrl && !submission.odRequestForm?.fileUrl && (
                <Typography variant="body2" color="textSecondary">
                  No documents uploaded
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Approval Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Approval Status
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Mentor</Typography>
                  <Chip
                    label={submission.mentorApproval?.approved === true ? 'Approved' : 
                           submission.mentorApproval?.approved === false ? 'Rejected' : 'Pending'}
                    color={submission.mentorApproval?.approved === true ? 'success' : 
                           submission.mentorApproval?.approved === false ? 'error' : 'warning'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Class Advisor</Typography>
                  <Chip
                    label={submission.classAdvisorApproval?.approved === true ? 'Approved' : 
                           submission.classAdvisorApproval?.approved === false ? 'Rejected' : 'Pending'}
                    color={submission.classAdvisorApproval?.approved === true ? 'success' : 
                           submission.classAdvisorApproval?.approved === false ? 'error' : 'warning'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">Innovation Coordinator</Typography>
                  <Chip
                    label={submission.innovationCoordinatorApproval?.approved === true ? 'Approved' : 
                           submission.innovationCoordinatorApproval?.approved === false ? 'Rejected' : 'Pending'}
                    color={submission.innovationCoordinatorApproval?.approved === true ? 'success' : 
                           submission.innovationCoordinatorApproval?.approved === false ? 'error' : 'warning'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary">HOD</Typography>
                  <Chip
                    label={submission.hodApproval?.approved === true ? 'Approved' : 
                           submission.hodApproval?.approved === false ? 'Rejected' : 'Pending'}
                    color={submission.hodApproval?.approved === true ? 'success' : 
                           submission.hodApproval?.approved === false ? 'error' : 'warning'}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">Current Stage</Typography>
                <Chip
                  label={submission.currentApprovalStage || 'N/A'}
                  color="info"
                  sx={{ mt: 0.5 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Approval History */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Approval History & Comments
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {/* Mentor Approval */}
              {submission.mentorApproval && (submission.mentorApproval.approved !== null || submission.mentorApproval.comments) && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">Mentor</Typography>
                    <Chip
                      label={submission.mentorApproval.approved === true ? 'Approved' : 
                             submission.mentorApproval.approved === false ? 'Rejected' : 'Pending'}
                      color={submission.mentorApproval.approved === true ? 'success' : 
                             submission.mentorApproval.approved === false ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>
                  {submission.mentorApproval.comments && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Comments:</strong> {submission.mentorApproval.comments}
                    </Typography>
                  )}
                  {submission.mentorApproval.approvedAt && (
                    <Typography variant="caption" color="textSecondary">
                      {new Date(submission.mentorApproval.approvedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}
              
              {/* Class Advisor Approval */}
              {submission.classAdvisorApproval && (submission.classAdvisorApproval.approved !== null || submission.classAdvisorApproval.comments) && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">Class Advisor</Typography>
                    <Chip
                      label={submission.classAdvisorApproval.approved === true ? 'Approved' : 
                             submission.classAdvisorApproval.approved === false ? 'Rejected' : 'Pending'}
                      color={submission.classAdvisorApproval.approved === true ? 'success' : 
                             submission.classAdvisorApproval.approved === false ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>
                  {submission.classAdvisorApproval.comments && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Comments:</strong> {submission.classAdvisorApproval.comments}
                    </Typography>
                  )}
                  {submission.classAdvisorApproval.approvedAt && (
                    <Typography variant="caption" color="textSecondary">
                      {new Date(submission.classAdvisorApproval.approvedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}
              
              {/* Innovation Coordinator Approval */}
              {submission.innovationCoordinatorApproval && (submission.innovationCoordinatorApproval.approved !== null || submission.innovationCoordinatorApproval.comments) && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">Innovation Coordinator</Typography>
                    <Chip
                      label={submission.innovationCoordinatorApproval.approved === true ? 'Approved' : 
                             submission.innovationCoordinatorApproval.approved === false ? 'Rejected' : 'Pending'}
                      color={submission.innovationCoordinatorApproval.approved === true ? 'success' : 
                             submission.innovationCoordinatorApproval.approved === false ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>
                  {submission.innovationCoordinatorApproval.comments && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Comments:</strong> {submission.innovationCoordinatorApproval.comments}
                    </Typography>
                  )}
                  {submission.innovationCoordinatorApproval.approvedAt && (
                    <Typography variant="caption" color="textSecondary">
                      {new Date(submission.innovationCoordinatorApproval.approvedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}
              
              {/* HOD Approval */}
              {submission.hodApproval && (submission.hodApproval.approved !== null || submission.hodApproval.comments) && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">HOD</Typography>
                    <Chip
                      label={submission.hodApproval.approved === true ? 'Approved' : 
                             submission.hodApproval.approved === false ? 'Rejected' : 'Pending'}
                      color={submission.hodApproval.approved === true ? 'success' : 
                             submission.hodApproval.approved === false ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>
                  {submission.hodApproval.comments && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Comments:</strong> {submission.hodApproval.comments}
                    </Typography>
                  )}
                  {submission.hodApproval.approvedAt && (
                    <Typography variant="caption" color="textSecondary">
                      {new Date(submission.hodApproval.approvedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}
              
              {/* Principal Approval */}
              {submission.principalApproval && (submission.principalApproval.approved !== null || submission.principalApproval.comments) && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle1" fontWeight="bold">Principal</Typography>
                    <Chip
                      label={submission.principalApproval.approved === true ? 'Approved' : 
                             submission.principalApproval.approved === false ? 'Rejected' : 'Pending'}
                      color={submission.principalApproval.approved === true ? 'success' : 
                             submission.principalApproval.approved === false ? 'error' : 'warning'}
                      size="small"
                    />
                  </Box>
                  {submission.principalApproval.comments && (
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Comments:</strong> {submission.principalApproval.comments}
                    </Typography>
                  )}
                  {submission.principalApproval.approvedAt && (
                    <Typography variant="caption" color="textSecondary">
                      {new Date(submission.principalApproval.approvedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              )}
              
              {!submission.mentorApproval && !submission.classAdvisorApproval && 
               !submission.innovationCoordinatorApproval && !submission.hodApproval && 
               !submission.principalApproval && (
                <Typography variant="body2" color="textSecondary">
                  No approval actions taken yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        {canApprove && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Approval Actions
              </Typography>
              <Box display="flex" gap={2} mt={2}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={handleApproveClick}
                  size="large"
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={handleRejectClick}
                  size="large"
                >
                  Reject
                </Button>
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Approval/Rejection Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'approve' ? 'Approve Submission' : 'Reject Submission'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label={actionType === 'approve' ? 'Comments (Optional)' : 'Rejection Reason (Required)'}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            sx={{ mt: 2 }}
            required={actionType === 'reject'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={actionType === 'approve' ? 'success' : 'error'}
            onClick={handleSubmitAction}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PhaseIApprovalDetail;
