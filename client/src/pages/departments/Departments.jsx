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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Checkbox,
} from '@mui/material';
import { Add, Edit, Delete, DeleteSweep } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', email: '', phone: '', establishedYear: '', numberOfSections: 3 });
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      setDepartments(response.data.data.departments || []);
    } catch (error) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => setOpenAdd(false);

  const handleOpenEdit = (dept) => {
    setEditingDepartment(dept);
    setForm({
      name: dept.name,
      code: dept.code,
      email: dept.email || '',
      phone: dept.phone || '',
      establishedYear: dept.establishedYear || '',
      numberOfSections: dept.numberOfSections || 3
    });
    setOpenEdit(true);
  };
  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditingDepartment(null);
  };

  const handleSubmitAdd = async () => {
    try {
      if (!form.name || !form.code) return toast.error('Name and Code are required');
      const payload = {
        name: form.name,
        code: form.code,
        email: form.email || undefined,
        phone: form.phone || undefined,
        establishedYear: form.establishedYear ? Number(form.establishedYear) : undefined,
        numberOfSections: form.numberOfSections ? Number(form.numberOfSections) : 3,
      };
      await api.post('/departments', payload);
      toast.success('Department added');
      handleCloseAdd();
      setForm({ name: '', code: '', email: '', phone: '', establishedYear: '', numberOfSections: 3 });
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add department');
    }
  };

  const handleSubmitEdit = async () => {
    try {
      if (!form.name || !form.code) return toast.error('Name and Code are required');
      const payload = {
        name: form.name,
        code: form.code,
        email: form.email || undefined,
        phone: form.phone || undefined,
        establishedYear: form.establishedYear ? Number(form.establishedYear) : undefined,
        numberOfSections: form.numberOfSections ? Number(form.numberOfSections) : 3,
      };
      await api.put(`/departments/${editingDepartment._id}`, payload);
      toast.success('Department updated');
      handleCloseEdit();
      setForm({ name: '', code: '', email: '', phone: '', establishedYear: '', numberOfSections: 3 });
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update department');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Department deleted successfully');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete department');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(departments.map(d => d._id));
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
      toast.warning('Please select departments to delete');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selected.length} department(s)?`)) return;
    try {
      await Promise.all(selected.map(id => api.delete(`/departments/${id}`)));
      toast.success(`${selected.length} department(s) deleted successfully`);
      setSelected([]);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete selected departments');
    }
  };

  const handleDeleteFiltered = async () => {
    if (departments.length === 0) {
      toast.warning('No departments found');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all ${departments.length} department(s)?`)) return;
    try {
      await Promise.all(departments.map(d => api.delete(`/departments/${d._id}`)));
      toast.success(`${departments.length} department(s) deleted successfully`);
      setSelected([]);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete departments');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Departments</Typography>
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
            disabled={departments.length === 0}
          >
            Delete All ({departments.length})
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
          >
            Add Department
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < departments.length}
                  checked={departments.length > 0 && selected.length === departments.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Sections</TableCell>
              <TableCell>HOD</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
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
            ) : departments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              departments.map((dept) => (
                <TableRow key={dept._id} selected={selected.includes(dept._id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(dept._id)}
                      onChange={() => handleSelectOne(dept._id)}
                    />
                  </TableCell>
                  <TableCell>{dept.code}</TableCell>
                  <TableCell>{dept.name}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`${dept.numberOfSections || 3} (${Array.from({ length: dept.numberOfSections || 3 }, (_, i) => String.fromCharCode(65 + i)).join(', ')})`}
                      color="primary"
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {dept.hodId
                      ? `${dept.hodId.firstName} ${dept.hodId.lastName}`
                      : 'Not Assigned'}
                  </TableCell>
                  <TableCell>{dept.description}</TableCell>
                  <TableCell>
                    <Chip
                      label={dept.isActive ? 'Active' : 'Inactive'}
                      color={dept.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<Edit />} onClick={() => handleOpenEdit(dept)}>
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<Delete />} 
                      onClick={() => handleDelete(dept._id)}
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

      <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="sm" fullWidth>
        <DialogTitle>Add Department</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required />
            <TextField label="Code" value={form.code} onChange={(e)=>setForm({...form, code:e.target.value})} required />
            <TextField 
              label="Number of Sections" 
              type="number" 
              value={form.numberOfSections} 
              onChange={(e)=>setForm({...form, numberOfSections:e.target.value})} 
              required
              inputProps={{ min: 1, max: 4 }}
              helperText="Enter number of sections (1-4). Sections will be named A, B, C, D"
            />
            <TextField label="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
            <TextField label="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
            <TextField label="Established Year" type="number" value={form.establishedYear} onChange={(e)=>setForm({...form, establishedYear:e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitAdd}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Department</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e)=>setForm({...form, name:e.target.value})} required />
            <TextField label="Code" value={form.code} onChange={(e)=>setForm({...form, code:e.target.value})} required />
            <TextField 
              label="Number of Sections" 
              type="number" 
              value={form.numberOfSections} 
              onChange={(e)=>setForm({...form, numberOfSections:e.target.value})} 
              required
              inputProps={{ min: 1, max: 4 }}
              helperText="Enter number of sections (1-4). Sections will be named A, B, C, D"
            />
            <TextField label="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} />
            <TextField label="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
            <TextField label="Established Year" type="number" value={form.establishedYear} onChange={(e)=>setForm({...form, establishedYear:e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitEdit}>Update</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Departments;
