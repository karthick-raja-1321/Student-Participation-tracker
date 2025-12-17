import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  HowToReg as RegisterIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const EventAnalytics = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filters
  const [filters, setFilters] = useState({
    departmentId: '',
    year: '',
    section: '',
    search: '',
    participationType: '',
    paymentStatus: ''
  });

  const [stats, setStats] = useState({
    totalViews: 0,
    studentViews: 0,
    facultyViews: 0,
    registrations: 0,
    notParticipated: 0
  });

  useEffect(() => {
    fetchEvent();
    fetchStats();
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [tabValue, page, rowsPerPage, filters]);

  const fetchEvent = async () => {
    try {
      const { data } = await api.get(`/events/${eventId}`);
      setEvent(data.data.event);
    } catch (error) {
      toast.error('Failed to fetch event details');
    }
  };

  const fetchStats = async () => {
    try {
      const [studentsViewed, facultyViewed, registered, notParticipated] = await Promise.all([
        api.get(`/events/${eventId}/viewers/students?limit=1`),
        api.get(`/events/${eventId}/viewers/faculty?limit=1`),
        api.get(`/events/${eventId}/registrations?limit=1`),
        api.get(`/events/${eventId}/not-participated?limit=1`)
      ]);

      // Handle both response structures (with and without data wrapper)
      const getTotal = (response) => {
        // Check all possible locations for total
        const total = response.data?.total || response.data?.data?.total || response.total || 0;
        console.log('API Response structure:', response.data, 'Extracted total:', total);
        return total;
      };

      const studentTotal = getTotal(studentsViewed);
      const facultyTotal = getTotal(facultyViewed);
      const registeredTotal = getTotal(registered);
      const notPartTotal = getTotal(notParticipated);

      console.log('Stats extracted:', { 
        studentViews: studentTotal, 
        facultyViews: facultyTotal, 
        registrations: registeredTotal, 
        notParticipated: notPartTotal 
      });

      setStats({
        studentViews: studentTotal,
        facultyViews: facultyTotal,
        registrations: registeredTotal,
        notParticipated: notPartTotal,
        totalViews: studentTotal + facultyTotal
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters
      };

      let endpoint = '';
      switch (tabValue) {
        case 0:
          endpoint = `/events/${eventId}/viewers/students`;
          break;
        case 1:
          endpoint = `/events/${eventId}/viewers/faculty`;
          break;
        case 2:
          endpoint = `/events/${eventId}/registrations`;
          break;
        case 3:
          endpoint = `/events/${eventId}/not-participated`;
          break;
        default:
          break;
      }

      const { data } = await api.get(endpoint, { params });
      setData(tabValue === 1 ? data.faculty : data.students);
      setTotal(data.total);
    } catch (error) {
      toast.error('Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(0);
    setFilters({
      departmentId: '',
      year: '',
      section: '',
      search: '',
      participationType: '',
      paymentStatus: ''
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const handleExport = async () => {
    try {
      let endpoint = '';
      switch (tabValue) {
        case 0:
          endpoint = `/events/${eventId}/viewers/students`;
          break;
        case 1:
          endpoint = `/events/${eventId}/viewers/faculty`;
          break;
        case 2:
          endpoint = `/events/${eventId}/registrations`;
          break;
        case 3:
          endpoint = `/events/${eventId}/not-participated`;
          break;
        default:
          break;
      }

      const { data } = await api.get(endpoint, { 
        params: { ...filters, limit: 10000 } 
      });

      const csvData = tabValue === 1 ? data.faculty : data.students;
      const csv = convertToCSV(csvData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-analytics-${tabValue}-${Date.now()}.csv`;
      a.click();
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const convertToCSV = (data) => {
    if (data.length === 0) return '';

    const headers = tabValue === 1 
      ? ['Employee ID', 'Name', 'Email', 'Department', 'View Count', 'First Viewed', 'Last Viewed']
      : ['Roll Number', 'Name', 'Email', 'Department', 'Year', 'Section', 
         ...(tabValue >= 2 ? ['Registration Date', 'Participation Type'] : ['View Count', 'First Viewed', 'Last Viewed']),
         ...(tabValue === 3 ? ['Days Since Registration'] : [])
        ];

    const rows = data.map(item => {
      const baseData = tabValue === 1 
        ? [
            item.employeeId,
            `${item.userId?.firstName} ${item.userId?.lastName}`,
            item.userId?.email,
            item.departmentId?.name,
            item.viewCount,
            new Date(item.firstViewedAt).toLocaleString(),
            new Date(item.lastViewedAt).toLocaleString()
          ]
        : [
            item.rollNumber,
            `${item.userId?.firstName} ${item.userId?.lastName}`,
            item.userId?.email,
            item.departmentId?.name,
            item.year,
            item.section,
            ...(tabValue >= 2 
              ? [
                  new Date(item.registrationDate).toLocaleString(),
                  item.participationType
                ]
              : [
                  item.viewCount,
                  new Date(item.firstViewedAt).toLocaleString(),
                  new Date(item.lastViewedAt).toLocaleString()
                ]),
            ...(tabValue === 3 ? [item.daysSinceRegistration] : [])
          ];

      return baseData.map(field => `"${field || ''}"`).join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/events')}
        >
          Back to Events
        </Button>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
          Event Analytics: {event?.title}
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon color="primary" />
                <Typography variant="h6">{stats.totalViews}</Typography>
              </Box>
              <Typography color="text.secondary">Total Views</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon color="info" />
                <Typography variant="h6">{stats.studentViews}</Typography>
              </Box>
              <Typography color="text.secondary">Student Views</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <RegisterIcon color="success" />
                <Typography variant="h6">{stats.registrations}</Typography>
              </Box>
              <Typography color="text.secondary">Registrations</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloseIcon color="warning" />
                <Typography variant="h6">{stats.notParticipated}</Typography>
              </Box>
              <Typography color="text.secondary">Not Participated</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label={`Students Viewed (${stats.studentViews})`} />
            <Tab label={`Faculty Viewed (${stats.facultyViews})`} />
            <Tab label={`Students Registered (${stats.registrations})`} />
            <Tab label={`Not Participated (${stats.notParticipated})`} />
          </Tabs>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder={tabValue === 1 ? "Employee ID, Name, Email" : "Roll No, Name, Email"}
            />
          </Grid>
          {tabValue !== 1 && (
            <>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Year"
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="1">1st Year</MenuItem>
                  <MenuItem value="2">2nd Year</MenuItem>
                  <MenuItem value="3">3rd Year</MenuItem>
                  <MenuItem value="4">4th Year</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Section"
                  value={filters.section}
                  onChange={(e) => handleFilterChange('section', e.target.value)}
                  placeholder="A, B, C..."
                />
              </Grid>
            </>
          )}
          {tabValue >= 2 && (
            <>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Participation Type"
                  value={filters.participationType}
                  onChange={(e) => handleFilterChange('participationType', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="INDIVIDUAL">Individual</MenuItem>
                  <MenuItem value="TEAM">Team</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Payment Status"
                  value={filters.paymentStatus}
                  onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="NOT_REQUIRED">Not Required</MenuItem>
                  <MenuItem value="PENDING">Pending</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                </TextField>
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setFilters({
                departmentId: '',
                year: '',
                section: '',
                search: '',
                participationType: '',
                paymentStatus: ''
              })}
            >
              Clear
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
          </Grid>
        </Grid>

        {/* Table */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{tabValue === 1 ? 'Employee ID' : 'Roll Number'}</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Department</TableCell>
                    {tabValue !== 1 && (
                      <>
                        <TableCell>Year</TableCell>
                        <TableCell>Section</TableCell>
                      </>
                    )}
                    {tabValue < 2 ? (
                      <>
                        <TableCell>View Count</TableCell>
                        <TableCell>First Viewed</TableCell>
                        <TableCell>Last Viewed</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>Registration Date</TableCell>
                        <TableCell>Type</TableCell>
                        {tabValue === 2 && <TableCell>Team Name</TableCell>}
                        {tabValue === 3 && <TableCell>Days Since Registration</TableCell>}
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{tabValue === 1 ? row.employeeId : row.rollNumber}</TableCell>
                      <TableCell>{`${row.userId?.firstName} ${row.userId?.lastName}`}</TableCell>
                      <TableCell>{row.userId?.email}</TableCell>
                      <TableCell>{row.departmentId?.name}</TableCell>
                      {tabValue !== 1 && (
                        <>
                          <TableCell>{row.year}</TableCell>
                          <TableCell>{row.section}</TableCell>
                        </>
                      )}
                      {tabValue < 2 ? (
                        <>
                          <TableCell>
                            <Chip label={row.viewCount} color="primary" size="small" />
                          </TableCell>
                          <TableCell>{new Date(row.firstViewedAt).toLocaleString()}</TableCell>
                          <TableCell>{new Date(row.lastViewedAt).toLocaleString()}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{new Date(row.registrationDate).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={row.participationType} 
                              color={row.participationType === 'TEAM' ? 'secondary' : 'default'} 
                              size="small" 
                            />
                          </TableCell>
                          {tabValue === 2 && <TableCell>{row.teamName || '-'}</TableCell>}
                          {tabValue === 3 && (
                            <TableCell>
                              <Chip 
                                label={`${row.daysSinceRegistration} days`} 
                                color={row.daysSinceRegistration > 7 ? 'error' : 'warning'} 
                                size="small" 
                              />
                            </TableCell>
                          )}
                        </>
                      )}
                    </TableRow>
                  ))}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={tabValue === 1 ? 7 : (tabValue < 2 ? 9 : 10)} align="center">
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>
    </Container>
  );
};

export default EventAnalytics;
