import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
} from '@mui/material';
import { Download, PictureAsPdf } from '@mui/icons-material';
import { toast } from 'react-toastify';

const Reports = () => {
  const [reportType, setReportType] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    department: '',
    year: '',
  });

  const handleGenerate = async (format = 'excel') => {
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }

    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.department) params.append('department', filters.department);
      if (filters.year) params.append('year', filters.year);

      const url = `/reports/export?${params.toString()}`;
      
      // Create a link and trigger download
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${url}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Participation_Report_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
    }
  };

  const handleDownloadWithProofs = async () => {
    if (!reportType) {
      toast.error('Please select a report type');
      return;
    }

    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.department) params.append('department', filters.department);
      if (filters.year) params.append('year', filters.year);

      const url = `/reports/export-with-proofs?${params.toString()}`;
      
      toast.info('Preparing report with submission proofs. This may take a while...');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}${url}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Participation_Report_With_Proofs_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Report with proofs downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report with proofs');
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Reports & Analytics
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <MenuItem value="participation">Student Participation Report</MenuItem>
              <MenuItem value="department">Department-wise Statistics</MenuItem>
              <MenuItem value="events">Event Summary Report</MenuItem>
              <MenuItem value="prizes">Prize Winners Report</MenuItem>
              <MenuItem value="pending">Pending Submissions Report</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              InputLabelProps={{ shrink: true }}
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              InputLabelProps={{ shrink: true }}
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Department"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <MenuItem value="">All Departments</MenuItem>
              <MenuItem value="CSE">CSE</MenuItem>
              <MenuItem value="ECE">ECE</MenuItem>
              <MenuItem value="EEE">EEE</MenuItem>
              <MenuItem value="MECH">MECH</MenuItem>
              <MenuItem value="CIVIL">CIVIL</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Year"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            >
              <MenuItem value="">All Years</MenuItem>
              <MenuItem value="1">1st Year</MenuItem>
              <MenuItem value="2">2nd Year</MenuItem>
              <MenuItem value="3">3rd Year</MenuItem>
              <MenuItem value="4">4th Year</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleGenerate('excel')}
              >
                Download Excel
              </Button>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleDownloadWithProofs}
              >
                Download with Submission Proofs (ZIP)
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Stats
        </Typography>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
              <Typography variant="h4" color="white">5</Typography>
              <Typography variant="body2" color="white">Total Events</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
              <Typography variant="h4" color="white">200</Typography>
              <Typography variant="body2" color="white">Total Students</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
              <Typography variant="h4" color="white">35</Typography>
              <Typography variant="body2" color="white">Registrations</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
              <Typography variant="h4" color="white">5</Typography>
              <Typography variant="body2" color="white">Departments</Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Reports;
