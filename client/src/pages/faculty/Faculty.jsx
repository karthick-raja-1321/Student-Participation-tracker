import React, { useState, useEffect, useMemo } from 'react';
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
  FormControlLabel,
  Divider,
  Grid,
} from '@mui/material';
import { Add, Edit, Delete, DeleteSweep, Clear } from '@mui/icons-material';
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
    designation: '',
    isClassAdvisor: false,
    classAdvisorYear: '',
    classAdvisorSection: '',
    isInnovationCoordinator: false
  });
  const [selected, setSelected] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Filtered and searched faculty
  const filteredFaculty = useMemo(() => {
    return faculty.filter(member => {
      // Search filter - check multiple fields
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        member.userId?.firstName?.toLowerCase().includes(searchLower) ||
        member.userId?.lastName?.toLowerCase().includes(searchLower) ||
        member.userId?.email?.toLowerCase().includes(searchLower) ||
        member.userId?.phone?.includes(searchQuery) ||
        member.employeeId?.toLowerCase().includes(searchLower);

      // Department filter
      const matchesDepartment = !filterDepartment || member.departmentId?._id === filterDepartment;

      // Designation filter
      const matchesDesignation = !filterDesignation || member.designation?.toLowerCase() === filterDesignation.toLowerCase();

      // Role filter
      let matchesRole = true;
      if (filterRole) {
        if (filterRole === 'classadvisor') {
          matchesRole = member.isClassAdvisor === true;
        } else if (filterRole === 'innovationcoordinator') {
          matchesRole = member.isInnovationCoordinator === true;
        } else if (filterRole === 'noroles') {
          matchesRole = !member.isClassAdvisor && !member.isInnovationCoordinator;
        }
      }

      return matchesSearch && matchesDepartment && matchesDesignation && matchesRole;
    });
  }, [faculty, searchQuery, filterDepartment, filterDesignation, filterRole]);

  // Get unique designations for filter
  const uniqueDesignations = useMemo(() => {
    return [...new Set(faculty.map(f => f.designation).filter(Boolean))].sort();
  }, [faculty]);

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
    const classAdvisor = member.advisorForClasses?.[0];
    setForm({
      firstName: member.userId?.firstName || '',
      lastName: member.userId?.lastName || '',
      email: member.userId?.email || '',
      phone: member.userId?.phone || '',
      employeeId: member.employeeId,
      departmentId: member.departmentId?._id || '',
      designation: member.designation || '',
      isClassAdvisor: member.isClassAdvisor || false,
      classAdvisorYear: classAdvisor?.year || '',
      classAdvisorSection: classAdvisor?.section || '',
      isInnovationCoordinator: member.isInnovationCoordinator || false
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
      
      if (form.isClassAdvisor && (!form.classAdvisorYear || !form.classAdvisorSection)) {
        return toast.error('Please fill Class Advisor year and section');
      }
      
      // Generate random password
      const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase() + '123';
      
      const advisorForClasses = form.isClassAdvisor ? [{
        year: parseInt(form.classAdvisorYear),
        section: form.classAdvisorSection.toUpperCase(),
        departmentId: form.departmentId
      }] : [];

      const innovationCoordinatorFor = form.isInnovationCoordinator ? [form.departmentId] : [];
      
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
          designation: form.designation,
          isClassAdvisor: form.isClassAdvisor,
          advisorForClasses,
          isInnovationCoordinator: form.isInnovationCoordinator,
          innovationCoordinatorFor
        }
      };
      await api.post('/faculty', payload);
      toast.success(`Faculty added! Password: ${generatedPassword} (Share with faculty to login)`, { autoClose: 10000 });
      handleCloseAdd();
      setForm({ firstName: '', lastName: '', email: '', phone: '', employeeId: '', departmentId: '', designation: '', isClassAdvisor: false, classAdvisorYear: '', classAdvisorSection: '', isInnovationCoordinator: false });
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
      
      if (form.isClassAdvisor && (!form.classAdvisorYear || !form.classAdvisorSection)) {
        return toast.error('Please fill Class Advisor year and section');
      }

      const advisorForClasses = form.isClassAdvisor ? [{
        year: parseInt(form.classAdvisorYear),
        section: form.classAdvisorSection.toUpperCase(),
        departmentId: form.departmentId
      }] : [];

      const innovationCoordinatorFor = form.isInnovationCoordinator ? [form.departmentId] : [];

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
          designation: form.designation,
          isClassAdvisor: form.isClassAdvisor,
          advisorForClasses,
          isInnovationCoordinator: form.isInnovationCoordinator,
          innovationCoordinatorFor
        }
      };
      await api.put(`/faculty/${editingFaculty._id}`, payload);
      toast.success('Faculty updated');
      handleCloseEdit();
      setForm({ firstName: '', lastName: '', email: '', phone: '', employeeId: '', departmentId: '', designation: '', isClassAdvisor: false, classAdvisorYear: '', classAdvisorSection: '', isInnovationCoordinator: false });
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
      setSelected(filteredFaculty.map(f => f._id));
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
    if (filteredFaculty.length === 0) {
      toast.warning('No faculty members found');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all ${filteredFaculty.length} faculty member(s)?`)) return;
    try {
      await Promise.all(filteredFaculty.map(f => api.delete(`/faculty/${f._id}`)));
      toast.success(`${filteredFaculty.length} faculty member(s) deleted successfully`);
      setSelected([]);
      fetchFaculty();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete faculty');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterDepartment('');
    setFilterDesignation('');
    setFilterRole('');
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
            disabled={filteredFaculty.length === 0}
          >
            Delete All ({filteredFaculty.length})
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

      {/* Search and Filter Section */}
      <Paper sx={{ p: 2, mb: 3, backgroundColor: '#f5f5f5' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 2 }}>Search & Filter</Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, phone, or Employee ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              size="small"
              select
              label="Filter by Department"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              variant="outlined"
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map(d => (
                <MenuItem key={d._id} value={d._id}>{d.code} - {d.name}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              select
              label="Filter by Designation"
              value={filterDesignation}
              onChange={(e) => setFilterDesignation(e.target.value)}
              variant="outlined"
            >
              <MenuItem value="">All Designations</MenuItem>
              {uniqueDesignations.map(des => (
                <MenuItem key={des} value={des}>{des}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              select
              label="Filter by Role"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              variant="outlined"
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="classadvisor">Class Advisor</MenuItem>
              <MenuItem value="innovationcoordinator">Innovation Coordinator</MenuItem>
              <MenuItem value="noroles">No Roles</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Clear />}
              onClick={handleClearFilters}
              sx={{ height: '40px' }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
        <Typography variant="caption" color="text.secondary">
          Showing {filteredFaculty.length} of {faculty.length} faculty members
        </Typography>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < filteredFaculty.length}
                  checked={filteredFaculty.length > 0 && selected.length === filteredFaculty.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Employee ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Designation</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
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
            ) : filteredFaculty.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No faculty found
                </TableCell>
              </TableRow>
            ) : (
              filteredFaculty.map((member) => {
                const roles = [];
                if (member.isClassAdvisor && member.advisorForClasses?.length > 0) {
                  const advisor = member.advisorForClasses[0];
                  roles.push(`${advisor.year} ${advisor.section}`);
                }
                if (member.isInnovationCoordinator) {
                  roles.push('Innovation Coordinator');
                }
                const rolesText = roles.length > 0 ? roles.join(', ') : 'No roles';

                return (
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
                    <TableCell>{member.departmentId?.code}</TableCell>
                    <TableCell>{member.designation}</TableCell>
                    <TableCell>{rolesText}</TableCell>
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
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    <Dialog open={openAdd} onClose={handleCloseAdd} maxWidth="sm" fullWidth>
      <DialogTitle>Add Faculty</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>Basic Information</Typography>
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

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Roles & Responsibilities</Typography>
          
          <FormControlLabel
            control={<Checkbox checked={form.isClassAdvisor} onChange={(e)=>setForm({...form, isClassAdvisor:e.target.checked})} />}
            label="Class Advisor"
          />
          {form.isClassAdvisor && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  label="Year" 
                  type="number" 
                  size="small"
                  inputProps={{ min: 1, max: 4 }}
                  value={form.classAdvisorYear} 
                  onChange={(e)=>setForm({...form, classAdvisorYear:e.target.value})} 
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Section" 
                  placeholder="e.g., A"
                  size="small"
                  value={form.classAdvisorSection} 
                  onChange={(e)=>setForm({...form, classAdvisorSection:e.target.value})} 
                  fullWidth
                />
              </Grid>
            </Grid>
          )}

          <FormControlLabel
            control={<Checkbox checked={form.isInnovationCoordinator} onChange={(e)=>setForm({...form, isInnovationCoordinator:e.target.checked})} />}
            label="Innovation Coordinator"
          />
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
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>Basic Information</Typography>
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

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Roles & Responsibilities</Typography>
          
          <FormControlLabel
            control={<Checkbox checked={form.isClassAdvisor} onChange={(e)=>setForm({...form, isClassAdvisor:e.target.checked})} />}
            label="Class Advisor"
          />
          {form.isClassAdvisor && (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField 
                  label="Year" 
                  type="number" 
                  size="small"
                  inputProps={{ min: 1, max: 4 }}
                  value={form.classAdvisorYear} 
                  onChange={(e)=>setForm({...form, classAdvisorYear:e.target.value})} 
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField 
                  label="Section" 
                  placeholder="e.g., A"
                  size="small"
                  value={form.classAdvisorSection} 
                  onChange={(e)=>setForm({...form, classAdvisorSection:e.target.value})} 
                  fullWidth
                />
              </Grid>
            </Grid>
          )}

          <FormControlLabel
            control={<Checkbox checked={form.isInnovationCoordinator} onChange={(e)=>setForm({...form, isInnovationCoordinator:e.target.checked})} />}
            label="Innovation Coordinator"
          />
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
