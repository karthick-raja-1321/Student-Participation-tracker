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
} from '@mui/material';
import { CheckCircle, Cancel, Visibility } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const Approvals = () => {
  const [tabValue, setTabValue] = useState(0);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovals();
  }, [tabValue]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const level = ['L1', 'L2', 'L3'][tabValue];
      const response = await api.get('/approvals', { params: { level } });
      setApprovals(response.data.data.approvals || []);
    } catch (error) {
      toast.error('Failed to fetch approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/approvals/${id}/approve`);
      toast.success('Approved successfully');
      fetchApprovals();
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(`/approvals/${id}/reject`);
      toast.success('Rejected successfully');
      fetchApprovals();
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Approval Queue
      </Typography>

      <Paper>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Level 1 (Class Advisor)" />
          <Tab label="Level 2 (Mentor)" />
          <Tab label="Level 3 (HOD)" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Submission Date</TableCell>
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
                ) : approvals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No pending approvals
                    </TableCell>
                  </TableRow>
                ) : (
                  approvals.map((approval) => (
                    <TableRow key={approval._id}>
                      <TableCell>{approval.studentId?.userId?.firstName}</TableCell>
                      <TableCell>{approval.submissionId?.eventDetails?.eventName}</TableCell>
                      <TableCell>
                        {new Date(approval.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={approval.status}
                          color={approval.status === 'PENDING' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button size="small" startIcon={<Visibility />} sx={{ mr: 1 }}>
                          View
                        </Button>
                        <Button
                          size="small"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => handleApprove(approval._id)}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<Cancel />}
                          onClick={() => handleReject(approval._id)}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </Box>
  );
};

export default Approvals;
