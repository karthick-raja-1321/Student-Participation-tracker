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
  TextField,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Toolbar,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, DeleteSweep, FilterAlt } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    rollNumber: '',
    departmentId: '',
    year: '',
    section: '',
    cgpa: ''
  });
  const [filters, setFilters] = useState({
    department: '',
    year: '',
    section: '',
    search: ''
  });
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
  }, [filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.department) params.departmentId = filters.department;
      if (filters.year) params.year = filters.year;
      if (filters.section) params.section = filters.section;
      if (filters.search) params.search = filters.search;
      
      const response = await api.get('/students', { params });
      setStudents(response.data.data.students || []);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.data.departments || []);
    } catch (e) {}
  };

  const handleOpenAdd = () => setOpenAdd(true);
  const handleCloseAdd = () => setOpenAdd(false);

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setForm({
      firstName: student.userId?.firstName || '',
      lastName: student.userId?.lastName || '',
      email: student.userId?.email || '',
      phone: student.userId?.phone || '',
      rollNumber: student.rollNumber,
      departmentId: student.departmentId?._id || '',
      year: String(student.year),
      section: student.section,
      cgpa: student.cgpa || ''
    });
    setOpenEdit(true);
  };
  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditingStudent(null);
  };

  const handleSubmitAdd = async () => {
    try {
      const required = ['firstName','lastName','email','rollNumber','departmentId','year','section'];
      for (const k of required) if (!form[k]) return toast.error('Please fill required fields');
      
      // Validate section based on department
      const selectedDept = departments.find(d => d._id === form.departmentId);
      const maxSection = selectedDept?.numberOfSections || 3;
      const sectionIndex = form.section.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      if (sectionIndex >= maxSection) {
        return toast.error(`${selectedDept?.name} only has sections A-${String.fromCharCode(65 + maxSection - 1)}`);
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
        studentData: {
          rollNumber: form.rollNumber,
          departmentId: form.departmentId,
          year: Number(form.year),
          section: form.section,
          cgpa: form.cgpa ? Number(form.cgpa) : undefined
        }
      };
      await api.post('/students', payload);
      toast.success(`Student added! Password: ${generatedPassword} (Share with student to login)`, { autoClose: 10000 });
      handleCloseAdd();
      setForm({ firstName:'', lastName:'', email:'', phone:'', rollNumber:'', departmentId:'', year:'', section:'', cgpa:'' });
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleSubmitEdit = async () => {
    try {
      const required = ['firstName','lastName','email','rollNumber','departmentId','year','section'];
      for (const k of required) if (!form[k]) return toast.error('Please fill required fields');
      const payload = {
        userData: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          departmentId: form.departmentId
        },
        studentData: {
          rollNumber: form.rollNumber,
          departmentId: form.departmentId,
          year: Number(form.year),
          section: form.section,
          cgpa: form.cgpa ? Number(form.cgpa) : undefined
        }
      };
      await api.put(`/students/${editingStudent._id}`, payload);
      toast.success('Student updated');
      handleCloseEdit();
      setForm({ firstName:'', lastName:'', email:'', phone:'', rollNumber:'', departmentId:'', year:'', section:'', cgpa:'' });
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update student');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(students.map(s => s._id));
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
      toast.warning('Please select students to delete');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selected.length} student(s)?`)) return;
    try {
      await Promise.all(selected.map(id => api.delete(`/students/${id}`)));
      toast.success(`${selected.length} student(s) deleted successfully`);
      setSelected([]);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete selected students');
    }
  };

  const handleDeleteFiltered = async () => {
    if (students.length === 0) {
      toast.warning('No students match the current filters');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all ${students.length} filtered student(s)?`)) return;
    try {
      await Promise.all(students.map(s => api.delete(`/students/${s._id}`)));
      toast.success(`${students.length} student(s) deleted successfully`);
      setSelected([]);
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete filtered students');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Students</Typography>
        <Box>
          {selected.length > 0 && (
            <>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Delete />}
                onClick={handleBulkDelete}
                sx={{ mr: 1 }}
              >
                Delete Selected ({selected.length})
              </Button>
            </>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweep />}
            onClick={handleDeleteFiltered}
            sx={{ mr: 1 }}
            disabled={students.length === 0}
          >
            Delete All Filtered ({students.length})
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenAdd}
          >
            Add Student
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
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
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Section"
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
            >
              <MenuItem value="">All Sections</MenuItem>
              <MenuItem value="A">A</MenuItem>
              <MenuItem value="B">B</MenuItem>
              <MenuItem value="C">C</MenuItem>
              <MenuItem value="D">D</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search by Roll Number"
              placeholder="Enter roll number"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  fetchStudents();
                }
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < students.length}
                  checked={students.length > 0 && selected.length === students.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Roll Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>CGPA</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No students found
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student._id} selected={selected.includes(student._id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(student._id)}
                      onChange={() => handleSelectOne(student._id)}
                    />
                  </TableCell>
                  <TableCell>{student.rollNumber}</TableCell>
                  <TableCell>
                    {student.userId?.firstName} {student.userId?.lastName}
                  </TableCell>
                  <TableCell>{student.userId?.email}</TableCell>
                  <TableCell>{student.phone || 'N/A'}</TableCell>
                  <TableCell>{student.year}</TableCell>
                  <TableCell>{student.section}</TableCell>
                  <TableCell>{student.cgpa?.toFixed(2) || 'N/A'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<Edit />} onClick={() => handleOpenEdit(student)}>
                      Edit
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      startIcon={<Delete />} 
                      onClick={() => handleDelete(student._id)}
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
        <DialogTitle>Add Student</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="First Name" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} required />
            <TextField label="Last Name" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} required />
            <TextField label="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
            <TextField label="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
            <TextField label="Roll Number" value={form.rollNumber} onChange={(e)=>setForm({...form, rollNumber:e.target.value})} required />
            <TextField select label="Department" value={form.departmentId} onChange={(e)=>setForm({...form, departmentId:e.target.value})} required>
              {departments.map(d=> (
                <MenuItem key={d._id} value={d._id}>{d.code} - {d.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Year" value={form.year} onChange={(e)=>setForm({...form, year:e.target.value})} required>
              <MenuItem value="1">1</MenuItem>
              <MenuItem value="2">2</MenuItem>
              <MenuItem value="3">3</MenuItem>
              <MenuItem value="4">4</MenuItem>
            </TextField>
            <TextField select label="Section" value={form.section} onChange={(e)=>setForm({...form, section:e.target.value})} required>
              {form.departmentId && (() => {
                const dept = departments.find(d => d._id === form.departmentId);
                const numSections = dept?.numberOfSections || 3;
                return Array.from({ length: numSections }, (_, i) => (
                  <MenuItem key={String.fromCharCode(65 + i)} value={String.fromCharCode(65 + i)}>
                    {String.fromCharCode(65 + i)}
                  </MenuItem>
                ));
              })()}
              {!form.departmentId && (
                <>
                  <MenuItem value="A">A</MenuItem>
                  <MenuItem value="B">B</MenuItem>
                  <MenuItem value="C">C</MenuItem>
                  <MenuItem value="D">D</MenuItem>
                </>
              )}
            </TextField>
            <TextField label="CGPA" type="number" value={form.cgpa} onChange={(e)=>setForm({...form, cgpa:e.target.value})} inputProps={{ step: '0.01', min: 0, max: 10 }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAdd}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitAdd}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Student</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="First Name" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} required />
            <TextField label="Last Name" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} required />
            <TextField label="Email" type="email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
            <TextField label="Phone" value={form.phone} onChange={(e)=>setForm({...form, phone:e.target.value})} />
            <TextField label="Roll Number" value={form.rollNumber} onChange={(e)=>setForm({...form, rollNumber:e.target.value})} required />
            <TextField select label="Department" value={form.departmentId} onChange={(e)=>setForm({...form, departmentId:e.target.value})} required>
              {departments.map(d=> (
                <MenuItem key={d._id} value={d._id}>{d.code} - {d.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Year" value={form.year} onChange={(e)=>setForm({...form, year:e.target.value})} required>
              <MenuItem value="1">1</MenuItem>
              <MenuItem value="2">2</MenuItem>
              <MenuItem value="3">3</MenuItem>
              <MenuItem value="4">4</MenuItem>
            </TextField>
            <TextField select label="Section" value={form.section} onChange={(e)=>setForm({...form, section:e.target.value})} required>
              {form.departmentId && (() => {
                const dept = departments.find(d => d._id === form.departmentId);
                const numSections = dept?.numberOfSections || 3;
                return Array.from({ length: numSections }, (_, i) => (
                  <MenuItem key={String.fromCharCode(65 + i)} value={String.fromCharCode(65 + i)}>
                    {String.fromCharCode(65 + i)}
                  </MenuItem>
                ));
              })()}
              {!form.departmentId && (
                <>
                  <MenuItem value="A">A</MenuItem>
                  <MenuItem value="B">B</MenuItem>
                  <MenuItem value="C">C</MenuItem>
                  <MenuItem value="D">D</MenuItem>
                </>
              )}
            </TextField>
            <TextField label="CGPA" type="number" value={form.cgpa} onChange={(e)=>setForm({...form, cgpa:e.target.value})} inputProps={{ step: '0.01', min: 0, max: 10 }} />
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

export default Students;
