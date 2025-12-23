import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
} from '@mui/material';
import { Add, Visibility, Edit, Delete, Search } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const Submissions = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [tabValue, setTabValue] = useState(0);
  const [phaseISubmissions, setPhaseISubmissions] = useState([]);
  const [phaseIISubmissions, setPhaseIISubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    fetchSubmissions();
  }, [tabValue]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      if (tabValue === 0) {
        const response = await api.get('/submissions/phase-i');
        setPhaseISubmissions(response.data.data.submissions || []);
      } else {
        const response = await api.get('/submissions/phase-ii');
        setPhaseIISubmissions(response.data.data.submissions || []);
      }
    } catch (error) {
      // If staff opens the page and backend restricts student-only, avoid noisy errors
      if (error.response?.status === 403) {
        setPhaseISubmissions([]);
        setPhaseIISubmissions([]);
      } else {
        toast.error('Failed to fetch submissions');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      SUBMITTED: 'info',
      UNDER_REVIEW: 'warning',
      APPROVED: 'success',
      REJECTED: 'error',
    };
    return colors[status] || 'default';
  };

  const handleDelete = async (submissionId) => {
    try {
      if (tabValue === 0) {
        await api.delete(`/submissions/phase-i/${submissionId}`);
      } else {
        await api.delete(`/submissions/phase-ii/${submissionId}`);
      }
      toast.success('Submission deleted successfully');
      setDeleteConfirm(null);
      fetchSubmissions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete submission');
    }
  };

  const handleViewSubmission = (submissionId) => {
    if (tabValue === 0) {
      navigate(`/on-duty/${submissionId}`);
    } else {
      navigate(`/participation-proof/${submissionId}`);
    }
  };

  const handleNewSubmission = () => {
    if (tabValue === 0) {
      navigate('/on-duty/new');
    } else {
      // For Phase II (Event Participation Proof), we need a Phase I submission ID
      // Show alert if no Phase I submissions exist
      if (phaseISubmissions.length === 0) {
        toast.warning('Please create an On Duty Process submission first');
        setTabValue(0);
        return;
      }
      // Navigate to new Event Participation Proof without requiring ID yet
      navigate('/participation-proof/new');
    }
  };

  // Filter submissions based on search and status
  const getFilteredSubmissions = (submissions) => {
    return submissions.filter((submission) => {
      const eventName = submission.eventDetails?.eventName || submission.eventId?.title || '';
      const matchesSearch = eventName.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = !statusFilter || submission.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  };

  const phaseIFiltered = getFilteredSubmissions(phaseISubmissions);
  const phaseIIFiltered = getFilteredSubmissions(phaseIISubmissions);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{isStudent ? 'My Submissions' : 'Submissions'}</Typography>
        {isStudent && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleNewSubmission}
          >
            {tabValue === 0 ? 'New On Duty Process' : 'New Event Participation Proof'}
          </Button>
        )}
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="On Duty Process" />
          <Tab label="Event Participation Proof" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {/* Filter and Search Section */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Search by event name..."
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
                }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                size="small"
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Filter by Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                size="small"
                variant="outlined"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="SUBMITTED">Submitted</MenuItem>
                <MenuItem value="UNDER_REVIEW">Under Review</MenuItem>
                <MenuItem value="APPROVED">Approved</MenuItem>
                <MenuItem value="REJECTED">Rejected</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          {tabValue === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Submission Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : phaseIFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        {searchText || statusFilter ? 'No submissions match your filters' : (isStudent ? 'No submissions found' : 'No student submissions to display')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    phaseIFiltered.map((submission) => (
                      <TableRow key={submission._id}>
                        <TableCell>{submission.eventDetails?.eventName || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={submission.status}
                            color={getStatusColor(submission.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button 
                            size="small" 
                            startIcon={<Visibility />}
                            onClick={() => handleViewSubmission(submission._id)}
                          >
                            View
                          </Button>
                          {/* Students: edit/delete before mentor decision; Staff: always */}
                          {(isStudent && (!submission.mentorApproval || submission.mentorApproval.approved === null)) || !isStudent ? (
                            <Button
                              size="small"
                              color="primary"
                              startIcon={<Edit />}
                              onClick={() => navigate(`/submissions/phase-i/${submission._id}/edit`)}
                              sx={{ ml: 1 }}
                            >
                              Edit
                            </Button>
                          ) : null}
                          {(isStudent && (!submission.mentorApproval || submission.mentorApproval.approved === null)) || !isStudent ? (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => setDeleteConfirm({ id: submission._id, phase: 'I' })}
                              sx={{ ml: 1 }}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 1 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Submission Date</TableCell>
                    <TableCell>Prize</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : phaseIIFiltered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {searchText || statusFilter ? 'No submissions match your filters' : 'No Phase II submissions found'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    phaseIIFiltered.map((submission) => (
                      <TableRow key={submission._id}>
                        <TableCell>{submission.eventId?.title || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{submission.prizeWon || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip
                            label={submission.status}
                            color={getStatusColor(submission.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button 
                            size="small" 
                            startIcon={<Visibility />}
                            onClick={() => handleViewSubmission(submission._id)}
                          >
                            View
                          </Button>
                          {/* Students: edit/delete until finalized; Staff: always */}
                          {(isStudent && submission.status !== 'APPROVED' && submission.status !== 'REJECTED') || !isStudent ? (
                            <Button
                              size="small"
                              color="primary"
                              startIcon={<Edit />}
                              onClick={() => navigate(`/submissions/phase-ii/${submission._id}/edit`)}
                              sx={{ ml: 1 }}
                            >
                              Edit
                            </Button>
                          ) : null}
                          {(isStudent && submission.status !== 'APPROVED' && submission.status !== 'REJECTED') || !isStudent ? (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => setDeleteConfirm({ id: submission._id, phase: 'II' })}
                              sx={{ ml: 1 }}
                            >
                              Delete
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this submission? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm.id)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Submissions;

