import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { CloudUpload, Download, CheckCircle } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const ExcelImport = () => {
  const [importType, setImportType] = useState('');
  const [file, setFile] = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast.error('Please select a valid Excel file');
        return;
      }
      setFile(selectedFile);
      setImportResults(null);
      toast.success(`File selected: ${selectedFile.name}`);
    }
  };

  const downloadTemplate = async () => {
    if (!importType) {
      toast.error('Please select import type first');
      return;
    }

    try {
      toast.info('Downloading template...');
      
      const response = await fetch(`${api.defaults.baseURL}/excel/templates/${importType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${importType}_template.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      toast.error('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!file || !importType) {
      toast.error('Please select import type and file');
      return;
    }

    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = `/excel/upload/${importType}`;
      const response = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const results = response.data.data;
      setImportResults(results);

      if (results.failed === 0) {
        toast.success(`Successfully imported ${results.successful} ${importType}!`);
      } else {
        toast.warning(`Imported ${results.successful} of ${results.total}. ${results.failed} failed.`);
      }
      
      setFile(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Import failed');
      if (error.response?.data?.data) {
        setImportResults(error.response.data.data);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Excel Import
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Import Configuration
            </Typography>

            <TextField
              select
              fullWidth
              label="Import Type"
              value={importType}
              onChange={(e) => setImportType(e.target.value)}
              sx={{ mb: 2 }}
            >
              <MenuItem value="students">Students</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
            </TextField>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download />}
              onClick={downloadTemplate}
              disabled={!importType}
              sx={{ mb: 2 }}
            >
              Download Template
            </Button>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, textAlign: 'center' }}>
              Or upload any Excel file - columns will be auto-detected
            </Typography>

            <Button
              fullWidth
              variant="contained"
              component="label"
              startIcon={<CloudUpload />}
              disabled={!importType}
            >
              Select Excel File
              <input
                type="file"
                hidden
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
            </Button>

            {file && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  {file.name}
                </Typography>
              </Alert>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Import Results
            </Typography>

            {importResults ? (
              <Box>
                <Alert severity={importResults.failed === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    Successfully imported: {importResults.successful} of {importResults.total}
                  </Typography>
                  {importResults.failed > 0 && (
                    <Typography variant="body2">
                      Failed: {importResults.failed}
                    </Typography>
                  )}
                </Alert>

                {importResults.errors && importResults.errors.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Errors ({importResults.errors.length}):
                    </Typography>
                    <TableContainer sx={{ mt: 2, maxHeight: 400 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Row</TableCell>
                            <TableCell>ID</TableCell>
                            <TableCell>Error</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {importResults.errors.map((error, index) => (
                            <TableRow key={index}>
                              <TableCell>{error.row}</TableCell>
                              <TableCell>{error.rollNumber || error.employeeId || 'N/A'}</TableCell>
                              <TableCell>
                                <Typography variant="body2" color="error">
                                  {error.error}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setImportResults(null);
                      setFile(null);
                    }}
                  >
                    Import Another File
                  </Button>
                </Box>
              </Box>
            ) : file ? (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  File ready to import: {file.name}
                </Alert>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Click "Import" to process the file. The system will validate:
                </Typography>
                <ul>
                  <li>Required fields</li>
                  <li>Department codes</li>
                  <li>Section validity (based on department's allowed sections)</li>
                  <li>Duplicate entries</li>
                  <li>Email uniqueness</li>
                </ul>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    onClick={handleImport}
                    disabled={importing}
                  >
                    {importing ? 'Importing...' : 'Import Now'}
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary" sx={{ mt: 2 }}>
                Select a file to begin import
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExcelImport;
