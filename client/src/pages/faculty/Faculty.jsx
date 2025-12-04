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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
} from '@mui/material';
import { Add, Edit, Delete, DeleteSweep } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeId: '',
    departmentId: '',
    designation: ''
  });
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
  }, []);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      const response = await api.get('/faculty');
      setFaculty(response.data.data.faculty || []);
    } catch (error) {
      toast.error('Failed to fetch faculty');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data.departments || []);
    } catch (e) {
      // ignore
    }
  };

  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => setOpenAdd(false);

  const handleOpenEdit = (member) => {
    setEditingFaculty(member);
    setForm({
      firstName: member.userId?.firstName || '',
      lastName: member.userId?.lastName || '',
      email: member.userId?.email || '',
      phone: member.userId?.phone || '',
      employeeId: member.employeeId,
      departmentId: member.departmentId?._id || '',
      designation: member.designation || ''
    });
    setOpenEdit(true);
  };
  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditingFaculty(null);
  };

  const handleSubmitAdd = async () => {
    try {
      if (!form.firstName || !form.lastName || !form.email || !form.employeeId || !form.departmentId) {
        return toast.error('Please fill required fields');
      }
      
      // Generate random password
      const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '123';
      
      const payload = {
        userData: {
          email: form.email,
          password: generatedPassword,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          departmentId: form.departmentId
        },
        facultyData: {
          employeeId: form.employeeId,
          departmentId: form.departmentId,
          designation: form.designation
        }
      };
      await api.post('/faculty', payload);
      toast.success(`Faculty added! Password: ${generatedPassword} (Share with faculty to login)`, { autoClose: 10000 });
      handleCloseAdd();
      setForm({ firstName: '', lastName: '', email: '', phone: '', employeeId: '', departmentId: '', designation: '' });
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add faculty');
    }
  };

  const handleSubmitEdit = async () => {
    try {
      if (!form.firstName || !form.lastName || !form.email || !form.employeeId || !form.departmentId) {
        return toast.error('Please fill required fields');
      }
      const payload = {
        userData: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          departmentId: form.departmentId
        },
        facultyData: {
          employeeId: form.employeeId,
          departmentId: form.departmentId,
          designation: form.designation
        }
      };
      await api.put(`/faculty/${editingFaculty._id}`, payload);
      toast.success('Faculty updated');
      handleCloseEdit();
      setForm({ firstName: '', lastName: '', email: '', phone: '', employeeId: '', departmentId: '', designation: '' });
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update faculty');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) return;
    try {
      await api.delete(`/faculty/${id}`);
      toast.success('Faculty deleted successfully');
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete faculty');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(faculty.map(f => f._id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) {
      toast.warning('Please select faculty to delete');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selected.length} faculty member(s)?`)) return;
    try {
      await Promise.all(selected.map(id => api.delete(`/faculty/${id}`)));
      toast.success(`${selected.length} faculty member(s) deleted successfully`);
      setSelected([]);
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete selected faculty');
    }
  };

  const handleDeleteFiltered = async () => {
    if (faculty.length === 0) {
      toast.warning('No faculty members found');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all ${faculty.length} faculty member(s)?`)) return;
    try {
      await Promise.all(faculty.map(f => api.delete(`/faculty/${f._id}`)));
      toast.success(`${faculty.length} faculty member(s) deleted successfully`);
      setSelected([]);
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete faculty');
    }
  };

  return (
    <>
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Faculty</Typography>
        <Box>
          {selected.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleBulkDelete}
              sx={{ mr: 1 }}
            >
              Delete Selected ({selected.length})
            </Button>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweep />}
            onClick={handleDeleteFiltered}
            sx={{ mr: 1 }}
            disabled={faculty.length === 0}
          >
            Delete All ({faculty.length})
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
          >
            Add Faculty
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < faculty.length}
                  checked={faculty.length > 0 && selected.length === faculty.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Designation</TableCell>
              <TableCell>Qualification</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : faculty.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No faculty found
                </TableCell>
              </TableRow>
            ) : (
              faculty.map((member) => (
                <TableRow key={member._id} selected={selected.includes(member._id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(member._id)}
                      onChange={() => handleSelectOne(member._id)}
                    />
                  </TableCell>
                  <TableCell>{member.employeeId}</TableCell>
                  <TableCell>
                    {member.userId?.firstName} {member.userId?.lastName}
                  </TableCell>
                  <TableCell>{member.designation}</TableCell>
                  <TableCell>{member.qualification}</TableCell>
                  <TableCell>{member.userId?.email}</TableCell>
                  <TableCell>{member.userId?.phone}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<Edit />} onClick={() => handleOpenEdit(member)}>
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<Delete />} 
                      onClick={() => handleDelete(member._id)}
                      sx={{ ml: 1 }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="sm" fullWidth>
      <DialogTitle>Add Faculty</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <TextField label="First Name" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} required />
          <TextField label="Last Name" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} required />
          <TextField label="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
          <TextField label="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
          <TextField label="Employee ID" value={form.employeeId} onChange={(e)=>setForm({...form, employeeId:e.target.value})} required />
          <TextField select label="Department" value={form.departmentId} onChange={(e)=>setForm({...form, departmentId:e.target.value})} required>
            {departments.map(d=> (
              <MenuItem key={d._id} value={d._id}>{d.code} - {d.name}</MenuItem>
            ))}
          </TextField>
          <TextField label="Designation" value={form.designation} onChange={(e)=>setForm({...form, designation:e.target.value})} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseAdd}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmitAdd}>Save</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Faculty</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <TextField label="First Name" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} required />
          <TextField label="Last Name" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} required />
          <TextField label="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
          <TextField label="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
          <TextField label="Employee ID" value={form.employeeId} onChange={(e)=>setForm({...form, employeeId:e.target.value})} required />
          <TextField select label="Department" value={form.departmentId} onChange={(e)=>setForm({...form, departmentId:e.target.value})} required>
            {departments.map(d=> (
              <MenuItem key={d._id} value={d._id}>{d.code} - {d.name}</MenuItem>
            ))}
          </TextField>
          <TextField label="Designation" value={form.designation} onChange={(e)=>setForm({...form, designation:e.target.value})} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseEdit}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmitEdit}>Update</Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default Faculty;
