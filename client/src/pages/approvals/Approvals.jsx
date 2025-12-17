import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const Approvals = () => {
  const [tabValue, setTabValue] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubmissions();
  }, [tabValue]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/submissions/phase-i');
      setSubmissions(response.data.data.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  const getTabs = () => {
    return ['Mentor Approvals', 'Class Advisor Approvals', 'Innovation Coordinator Approvals', 'HOD Approvals'];
  };

  const filterSubmissionsByRole = (items) => {
    const notRejected = (submission) => submission.status?.toLowerCase() !== 'rejected';
    const isPending = (submission, field) => {
      const approval = submission[field];
      return approval?.approved === undefined || approval?.approved === null;
    };
    const isApproved = (submission, field) => submission[field]?.approved === true;

    if (tabValue === 0) {
      // Mentor stage: show pending mentor approvals
      return items.filter(s => s.mentorApproval !== undefined && notRejected(s) && isPending(s, 'mentorApproval'));
    }

    if (tabValue === 1) {
      // Class Advisor stage: mentor must approve first
      return items.filter(s => 
        isApproved(s, 'mentorApproval') &&
        s.classAdvisorApproval !== undefined &&
        notRejected(s) &&
        isPending(s, 'classAdvisorApproval')
      );
    }

    if (tabValue === 2) {
      // Innovation Coordinator after Class Advisor
      return items.filter(s => 
        isApproved(s, 'mentorApproval') &&
        isApproved(s, 'classAdvisorApproval') &&
        s.innovationCoordinatorApproval !== undefined &&
        notRejected(s) &&
        isPending(s, 'innovationCoordinatorApproval')
      );
    }

    // HOD tab: HOD can act at any stage, just exclude rejected and already decided HOD approvals
    return items.filter(s => 
      s.hodApproval !== undefined &&
      notRejected(s) &&
      isPending(s, 'hodApproval')
    );
  };

  const allFilteredSubmissions = filterSubmissionsByRole(submissions);
  
  // Sort: pending approvals first, then past approvals
  const sortApprovals = (submissions) => {
    return submissions.sort((a, b) => {
      const getApprovalForRole = (sub, role) => {
        if (role === 0) return sub.mentorApproval;
        if (role === 1) return sub.classAdvisorApproval;
        if (role === 2) return sub.innovationCoordinatorApproval;
        return sub.hodApproval;
      };
      
      const aApproval = getApprovalForRole(a, tabValue);
      const bApproval = getApprovalForRole(b, tabValue);
      
      // Pending (undefined approved status) comes first
      const aIsPending = aApproval?.approved === undefined || aApproval?.approved === null;
      const bIsPending = bApproval?.approved === undefined || bApproval?.approved === null;
      
      if (aIsPending && !bIsPending) return -1;
      if (!aIsPending && bIsPending) return 1;
      return 0;
    });
  };
  
  const pendingSubmissions = sortApprovals(allFilteredSubmissions);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="600px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Submission Approvals
      </Typography>

      <Paper>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          {getTabs().map((tab, index) => (
            <Tab key={index} label={tab} />
          ))}
        </Tabs>
      </Paper>

      {pendingSubmissions.length === 0 ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          No pending submissions for approval in this category.
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell><strong>S No</strong></TableCell>
                <TableCell><strong>Roll Number</strong></TableCell>
                <TableCell><strong>Student Name</strong></TableCell>
                <TableCell><strong>Event Name</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell align="center"><strong>View</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingSubmissions.map((submission, index) => (
                <TableRow key={submission._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{submission.studentId?.rollNumber || 'N/A'}</TableCell>
                  <TableCell>{`${submission.studentId?.userId?.firstName || ''} ${submission.studentId?.userId?.lastName || ''}`.trim() || 'N/A'}</TableCell>
                  <TableCell>{submission.eventId?.title || submission.eventDetails?.eventName || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={submission.status} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/approvals/phase-i/${submission._id}`, { state: { fromHod: tabValue === 3 } })}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default Approvals;
