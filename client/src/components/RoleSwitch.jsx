import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Alert,
  Chip,
  Typography,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { SwapHoriz, Close } from '@mui/icons-material';
import { updateUser } from '../store/slices/authSlice';
import api from '../utils/api';
import { toast } from 'react-toastify';

const RoleSwitch = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && user?.role === 'SUPER_ADMIN') {
      fetchAvailableRoles();
    }
  }, [open, user?.role]);

  const fetchAvailableRoles = async () => {
    try {
      setLoadingRoles(true);
      setError('');
      const response = await api.get('/auth/available-roles');
      if (response.data.status === 'success') {
        setAvailableRoles(response.data.data.roles);
        setDepartments(response.data.data.departments || []);
        setSelectedRole(response.data.data.simulatedRole || '');
      }
    } catch (err) {
      setError('Failed to fetch available roles');
      console.error(err);
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRefreshRoles = async () => {
    await fetchAvailableRoles();
    toast.info('Roles and departments refreshed');
  };

  const handleSwitchRole = async () => {
    try {
      if (!selectedRole) {
        setError('Please select a role');
        return;
      }

      // Department is required for non-SUPER_ADMIN roles
      if (selectedRole !== 'SUPER_ADMIN' && !selectedDepartment) {
        setError('Please select a department for this role');
        return;
      }

      setLoading(true);
      setError('');

      const response = await api.post('/auth/switch-role', {
        targetRole: selectedRole,
        targetDepartmentId: selectedDepartment || null,
      });

      if (response.data.status === 'success') {
        // Update Redux store with new user data
        dispatch(updateUser(response.data.data.user));
        
        toast.success(`Successfully switched to ${selectedRole} role`);
        onClose();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to switch role';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetRole = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.post('/auth/reset-role');

      if (response.data.status === 'success') {
        // Update Redux store with original role
        dispatch(updateUser(response.data.data.user));
        
        toast.success('Role reset to original');
        setSelectedRole('');
        setSelectedDepartment('');
        onClose();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to reset role';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const isTestMode = user?.isTestMode || false;
  const currentRole = user?.originalRole || user?.role;
  const simulatedRole = user?.simulatedRole;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <SwapHoriz />
        Role Simulator (SUPER_ADMIN Only)
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {!loadingRoles ? (
          <>
            {/* Current Status */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Current Role
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 2 }}>
                <Chip
                  label={currentRole}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>

              {isTestMode && simulatedRole && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Simulated Role
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={simulatedRole}
                      color="warning"
                      size="small"
                    />
                    <Chip
                      label="TEST MODE"
                      color="error"
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </>
              )}
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Role Selection */}
            <TextField
              select
              fullWidth
              label="Select Role to Simulate"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setSelectedDepartment(''); // Reset department when role changes
              }}
              disabled={loading}
              sx={{ mb: 2 }}
              helperText="Choose a role to test the system as that role"
            >
              {availableRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>

            {/* Department Selection */}
            {selectedRole && selectedRole !== 'SUPER_ADMIN' && (
              <TextField
                select
                fullWidth
                label="Select Department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                disabled={loading}
                sx={{ mb: 2 }}
                helperText="Required for department-specific roles"
              >
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* Information */}
            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="caption">
                🔄 <strong>How it works:</strong> When you switch roles, you'll see and interact with the system exactly as that role would.
                Your original role ({currentRole}) is preserved and can be restored anytime.
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                Tip: If faculty roles were recently changed (e.g., Innovation Coordinator/Class Advisor), click <strong>Refresh Roles</strong> to re-sync access.
              </Typography>
            </Alert>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        {isTestMode && (
          <Button
            variant="outlined"
            color="error"
            onClick={handleResetRole}
            disabled={loading}
          >
            Reset to {currentRole}
          </Button>
        )}
        <Button variant="text" onClick={handleRefreshRoles} disabled={loading || loadingRoles}>
          Refresh Roles
        </Button>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleSwitchRole}
          disabled={loading || !selectedRole || loadingRoles}
        >
          {loading ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
          Switch Role
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleSwitch;
