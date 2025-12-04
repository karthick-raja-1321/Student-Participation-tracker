import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Divider,
  Table,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import { ArrowBack, Download, Print } from '@mui/icons-material';
import api from '../../utils/api';

const ODReceipt = () => {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  const receiptRef = useRef();
  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceiptData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/students/submissions/${submissionId}/od-receipt`);
        if (response.data.status === 'success') {
          setReceiptData(response.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch receipt data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReceiptData();
  }, [submissionId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    // You can integrate jsPDF or html2pdf here
    // For now, using browser print functionality
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Back
        </Button>
        <Typography color="error">Failed to load receipt: {error}</Typography>
      </Box>
    );
  }

  const { student, event, advisor, mentor, hod, approval, onDutyBalance } = receiptData || {};

  return (
    <Box>
      {/* Action Buttons - Hide on print */}
      <Box className="no-print" sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Button startIcon={<Print />} variant="outlined" onClick={handlePrint}>
          Print
        </Button>
        <Button startIcon={<Download />} variant="contained" onClick={handleDownloadPDF}>
          Download PDF
        </Button>
      </Box>

      {/* Receipt Content */}
      <Paper 
        ref={receiptRef}
        sx={{ 
          p: 4, 
          maxWidth: '800px', 
          margin: '0 auto',
          '@media print': {
            boxShadow: 'none',
            margin: 0,
            maxWidth: '100%'
          }
        }}
      >
        {/* Header */}
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            ON-DUTY APPROVAL CERTIFICATE
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {student?.department}
          </Typography>
          <Divider sx={{ mt: 2 }} />
        </Box>

        {/* Certificate Number and Date */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6}>
            <Typography variant="body2" color="text.secondary">Certificate No:</Typography>
            <Typography variant="body1" fontWeight="medium">
              OD/{approval?.submissionId?.toString().slice(-6)}
            </Typography>
          </Grid>
          <Grid item xs={6} textAlign="right">
            <Typography variant="body2" color="text.secondary">Approval Date:</Typography>
            <Typography variant="body1" fontWeight="medium">
              {new Date(approval?.approvedAt).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>

        {/* Student Details */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Student Details
          </Typography>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium', width: '30%' }}>Name</TableCell>
                <TableCell>{student?.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium' }}>Roll Number</TableCell>
                <TableCell>{student?.rollNumber}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium' }}>Year & Section</TableCell>
                <TableCell>{student?.year} - {student?.section}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium' }}>Email</TableCell>
                <TableCell>{student?.email}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {/* Event Details */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Event Details
          </Typography>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium', width: '30%' }}>Event Title</TableCell>
                <TableCell>{event?.title}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium' }}>Event Type</TableCell>
                <TableCell>{event?.type}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium' }}>Event Dates</TableCell>
                <TableCell>
                  {new Date(event?.startDate).toLocaleDateString()} to {new Date(event?.endDate).toLocaleDateString()}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium' }}>Location</TableCell>
                <TableCell>{event?.location}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {/* Approvals */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Approvals
          </Typography>
          <Table size="small">
            <TableBody>
              {mentor && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium', width: '30%' }}>Faculty Mentor</TableCell>
                  <TableCell>
                    {mentor.name}
                    <br />
                    <Typography variant="caption" color="text.secondary">{mentor.email}</Typography>
                  </TableCell>
                </TableRow>
              )}
              {advisor && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>Class Advisor</TableCell>
                  <TableCell>
                    {advisor.name}
                    <br />
                    <Typography variant="caption" color="text.secondary">{advisor.email}</Typography>
                  </TableCell>
                </TableRow>
              )}
              {hod && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 'medium' }}>Head of Department</TableCell>
                  <TableCell>
                    {hod.name}
                    <br />
                    <Typography variant="caption" color="text.secondary">{hod.email}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>

        {/* On-Duty Balance */}
        <Box mb={3}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            On-Duty Balance Status
          </Typography>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium', width: '30%' }}>Total Allowed</TableCell>
                <TableCell>{onDutyBalance?.totalAllowed}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium' }}>Availed</TableCell>
                <TableCell>{onDutyBalance?.availed}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'medium' }}>Balance Remaining</TableCell>
                <TableCell fontWeight="bold" color={onDutyBalance?.balance > 0 ? 'success.main' : 'error.main'}>
                  {onDutyBalance?.balance}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {/* Remarks */}
        {approval?.remarks && (
          <Box mb={3}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Remarks
            </Typography>
            <Typography variant="body2" sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              {approval.remarks}
            </Typography>
          </Box>
        )}

        {/* Footer */}
        <Box mt={4} pt={3} borderTop="1px solid" borderColor="divider">
          <Typography variant="body2" color="text.secondary" textAlign="center">
            This is a computer-generated certificate and does not require a signature.
          </Typography>
          <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={1}>
            Generated on {new Date().toLocaleString()}
          </Typography>
        </Box>
      </Paper>

      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              margin: 0;
              padding: 20px;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default ODReceipt;
