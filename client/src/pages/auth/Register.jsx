import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  MenuItem,
  Box,
  CircularProgress,
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../../utils/api';

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required').min(2, 'Too short'),
  lastName: Yup.string().required('Last name is required').min(2, 'Too short'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain lowercase letter')
    .matches(/[A-Z]/, 'Must contain uppercase letter')
    .matches(/[0-9]/, 'Must contain number'),
  confirmPassword: Yup.string()
    .required('Please confirm password')
    .oneOf([Yup.ref('password')], 'Passwords must match'),
  role: Yup.string().required('Role is required'),
  phone: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
    .required('Phone is required'),
  departmentId: Yup.string().when('role', {
    is: (role) => role !== 'SUPER_ADMIN',
    then: (schema) => schema.required('Department is required'),
  }),
  employeeId: Yup.string().when('role', {
    is: (role) => role === 'FACULTY' || role === 'HOD',
    then: (schema) => schema.required('Employee ID is required'),
  }),
});

const Register = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loadingDepts, setLoadingDepts] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoadingDepts(true);
    try {
      const response = await api.get('/departments');
      setDepartments(response.data.data.departments || []);
    } catch (err) {
      console.error('Failed to load departments:', err);
    } finally {
      setLoadingDepts(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'STUDENT',
      phone: '',
      departmentId: '',
      employeeId: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        const payload = {
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          password: values.password,
          role: values.role,
          phone: values.phone,
        };

        if (values.role !== 'SUPER_ADMIN') {
          payload.departmentId = values.departmentId;
        }

        if (values.role === 'FACULTY' || values.role === 'HOD') {
          payload.employeeId = values.employeeId;
        }

        await api.post('/auth/register', payload);
        navigate('/login', {
          state: { message: 'Registration successful! Please login.' },
        });
      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Register
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" mb={3}>
          Create your account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Box display="flex" gap={2} mb={2}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formik.values.firstName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.firstName && Boolean(formik.errors.firstName)}
              helperText={formik.touched.firstName && formik.errors.firstName}
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.lastName && Boolean(formik.errors.lastName)}
              helperText={formik.touched.lastName && formik.errors.lastName}
            />
          </Box>

          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Phone (10 digits)"
            name="phone"
            value={formik.values.phone}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.phone && Boolean(formik.errors.phone)}
            helperText={formik.touched.phone && formik.errors.phone}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            select
            label="Role"
            name="role"
            value={formik.values.role}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.role && Boolean(formik.errors.role)}
            helperText={formik.touched.role && formik.errors.role}
            sx={{ mb: 2 }}
          >
            <MenuItem value="STUDENT">Student</MenuItem>
            <MenuItem value="FACULTY">Faculty</MenuItem>
            <MenuItem value="HOD">HOD</MenuItem>
            <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
          </TextField>

          {formik.values.role !== 'SUPER_ADMIN' && (
            <TextField
              fullWidth
              select
              label="Department"
              name="departmentId"
              value={formik.values.departmentId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.departmentId && Boolean(formik.errors.departmentId)}
              helperText={formik.touched.departmentId && formik.errors.departmentId}
              disabled={loadingDepts}
              sx={{ mb: 2 }}
            >
              {departments.map((dept) => (
                <MenuItem key={dept._id} value={dept._id}>
                  {dept.name} ({dept.code})
                </MenuItem>
              ))}
            </TextField>
          )}

          {(formik.values.role === 'FACULTY' || formik.values.role === 'HOD') && (
            <TextField
              fullWidth
              label="Employee ID"
              name="employeeId"
              value={formik.values.employeeId}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.employeeId && Boolean(formik.errors.employeeId)}
              helperText={formik.touched.employeeId && formik.errors.employeeId}
              sx={{ mb: 2 }}
            />
          )}

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
            helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={formik.isSubmitting}
          >
            {formik.isSubmitting ? <CircularProgress size={24} /> : 'Register'}
          </Button>

          <Box textAlign="center" mt={2}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
                Login here
              </Link>
            </Typography>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default Register;
