import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Save, Lock, VpnKey } from '@mui/icons-material';
import { toast } from 'react-toastify';
import api from '../utils/api';

const Settings = () => {
  const { user } = useSelector((state) => state.auth);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [openAdminReset, setOpenAdminReset] = useState(false);
  const [adminResetData, setAdminResetData] = useState({
    userId: '',
    email: '',
    newPassword: '',
  });

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      await api.put('/auth/me', profileData);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminResetPassword = async () => {
    if (!adminResetData.email) {
      toast.error('Please enter user email');
      return;
    }

    try {
      setLoading(true);
      // Search for user by email
      const searchResponse = await api.get(`/students?search=${adminResetData.email}`);
      let userId = null;
      
      if (searchResponse.data.data.students?.length > 0) {
        userId = searchResponse.data.data.students[0].userId._id;
      } else {
        // Try faculty
        const facultyResponse = await api.get(`/faculty`);
        const faculty = facultyResponse.data.data.faculty?.find(f => f.userId?.email === adminResetData.email);
        if (faculty) {
          userId = faculty.userId._id;
        }
      }

      if (!userId) {
        toast.error('User not found');
        return;
      }

      // Generate or use provided password
      const newPassword = adminResetData.newPassword || 
                         Math.random().toString(36).slice(-8) + 
                         Math.random().toString(36).slice(-8).toUpperCase() + '123';

      const response = await api.post(`/admin/reset-password/${userId}`, {
        newPassword
      });

      toast.success(`Password reset successfully! New password: ${response.data.data.newPassword}`, {
        autoClose: 10000
      });
      
      setOpenAdminReset(false);
      setAdminResetData({ userId: '', email: '', newPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ width: 80, height: 80, mr: 2, bgcolor: 'primary.main' }}>
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {user?.firstName} {user?.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.role}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={profileData.firstName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, firstName: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={profileData.lastName}
                  onChange={(e) =>
                    setProfileData({ ...profileData, lastName: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profileData.email}
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={profileData.phone}
                  onChange={(e) =>
                    setProfileData({ ...profileData, phone: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleProfileUpdate}
                  disabled={loading}
                >
                  Save Changes
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Current Password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="New Password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<Lock />}
                  onClick={handlePasswordChange}
                  disabled={loading}
                >
                  Change Password
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {user?.role === 'SUPER_ADMIN' && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom color="error">
                Admin: Reset User Password
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                As SUPER_ADMIN, you can reset any user's password
              </Typography>

              <Button
                variant="outlined"
                color="error"
                startIcon={<VpnKey />}
                onClick={() => setOpenAdminReset(true)}
                fullWidth
              >
                Reset User Password
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* Admin Reset Password Dialog */}
      <Dialog open={openAdminReset} onClose={() => setOpenAdminReset(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reset User Password (Admin)</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="User Email"
              value={adminResetData.email}
              onChange={(e) => setAdminResetData({ ...adminResetData, email: e.target.value })}
              helperText="Enter the email of the user whose password you want to reset"
            />
            <TextField
              fullWidth
              label="New Password (Optional)"
              type="password"
              value={adminResetData.newPassword}
              onChange={(e) => setAdminResetData({ ...adminResetData, newPassword: e.target.value })}
              helperText="Leave empty to auto-generate a random password"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdminReset(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleAdminResetPassword}
            disabled={loading}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
