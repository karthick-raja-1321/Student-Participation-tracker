import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';

const Mentorship = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [mentoredStudents, setMentoredStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalSubmissions: 0,
    pendingApprovals: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchMentorshipData();
  }, []);

  const fetchMentorshipData = async () => {
    try {
      setLoading(true);
      
      // Fetch mentored students
      const studentsResponse = await api.get('/students?mentorView=true');
      const students = studentsResponse.data.data.students || [];
      setMentoredStudents(students);

      // Fetch submissions for mentored students
      const submissionsResponse = await api.get('/submissions/phase-i');
      const allSubmissions = submissionsResponse.data.data.submissions || [];
      
      // Filter submissions where current user is the mentor
      const mentorSubmissions = allSubmissions.filter(sub => 
        sub.currentApprovalStage === 'MENTOR' || 
        sub.mentorApproval?.approved !== undefined
      );
      setSubmissions(mentorSubmissions);

      // Calculate stats
      const pendingCount = mentorSubmissions.filter(s => 
        s.currentApprovalStage === 'MENTOR' && !s.mentorApproval?.approved
      ).length;
      
      const approvedCount = mentorSubmissions.filter(s => 
        s.mentorApproval?.approved === true
      ).length;
      
      const rejectedCount = mentorSubmissions.filter(s => 
        s.mentorApproval?.approved === false && s.mentorApproval?.comments
      ).length;

      setStats({
        totalStudents: students.length,
        totalSubmissions: mentorSubmissions.length,
        pendingApprovals: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      });

    } catch (error) {
      console.error('Error fetching mentorship data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleViewSubmission = (submissionId) => {
    navigate(`/approvals/phase-i/${submissionId}`);
  };

  const getStatusChip = (submission) => {
    if (submission.mentorApproval?.approved === true) {
      return <Chip label="Approved" color="success" size="small" icon={<CheckCircleIcon />} />;
    } else if (submission.mentorApproval?.approved === false) {
      return <Chip label="Rejected" color="error" size="small" icon={<CancelIcon />} />;
    } else if (submission.currentApprovalStage === 'MENTOR') {
      return <Chip label="Pending" color="warning" size="small" icon={<PendingIcon />} />;
    }
    return <Chip label="Unknown" size="small" />;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Mentorship Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Mentored Students
                  </Typography>
                  <Typography variant="h4">{stats.totalStudents}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Total Submissions
                  </Typography>
                  <Typography variant="h4">{stats.totalSubmissions}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Pending Approvals
                  </Typography>
                  <Typography variant="h4">{stats.pendingApprovals}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <PendingIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" variant="body2">
                    Approved
                  </Typography>
                  <Typography variant="h4">{stats.approved}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={`Pending Approvals (${stats.pendingApprovals})`} />
          <Tab label={`Mentored Students (${stats.totalStudents})`} />
          <Tab label={`All Submissions (${stats.totalSubmissions})`} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Submitted On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions
                  .filter(s => s.currentApprovalStage === 'MENTOR' && !s.mentorApproval?.approved)
                  .map((submission) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        {submission.studentId?.userId?.firstName} {submission.studentId?.userId?.lastName}
                      </TableCell>
                      <TableCell>{submission.studentId?.rollNumber || submission.studentId?.registerNumber}</TableCell>
                      <TableCell>{submission.eventId?.title}</TableCell>
                      <TableCell>
                        {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>{getStatusChip(submission)}</TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleViewSubmission(submission._id)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          {submissions.filter(s => s.currentApprovalStage === 'MENTOR' && !s.mentorApproval?.approved).length === 0 && (
            <Box p={3} textAlign="center">
              <Alert severity="info">No pending approvals at this time.</Alert>
            </Box>
          )}
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Department</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mentoredStudents.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>{student.rollNumber || student.registerNumber}</TableCell>
                    <TableCell>
                      {student.userId?.firstName || student.firstName} {student.userId?.lastName || student.lastName}
                    </TableCell>
                    <TableCell>{student.userId?.email}</TableCell>
                    <TableCell>{student.year}</TableCell>
                    <TableCell>{student.section}</TableCell>
                    <TableCell>{student.departmentId?.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {mentoredStudents.length === 0 && (
            <Box p={3} textAlign="center">
              <Alert severity="info">No students assigned as mentor yet.</Alert>
            </Box>
          )}
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Roll Number</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Submitted On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission._id}>
                    <TableCell>
                      {submission.studentId?.userId?.firstName} {submission.studentId?.userId?.lastName}
                    </TableCell>
                    <TableCell>{submission.studentId?.rollNumber || submission.studentId?.registerNumber}</TableCell>
                    <TableCell>{submission.eventId?.title}</TableCell>
                    <TableCell>
                      {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusChip(submission)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => handleViewSubmission(submission._id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {submissions.length === 0 && (
            <Box p={3} textAlign="center">
              <Alert severity="info">No submissions found.</Alert>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default Mentorship;
