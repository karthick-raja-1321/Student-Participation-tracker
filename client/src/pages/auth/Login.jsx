import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { loginSuccess } from '../../store/slices/authSlice';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', formData);
      console.log('Login response:', response.data);
      
      const { user, token, refreshToken } = response.data.data;

      if (!token || !refreshToken) {
        throw new Error('Invalid response from server');
      }

      dispatch(loginSuccess({ user, token, refreshToken }));
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Login
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Student Participation Tracking System
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            required
            margin="normal"
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link to="/register" style={{ textDecoration: 'none', color: '#1976D2' }}>
              Don't have an account? Register
            </Link>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Login;
