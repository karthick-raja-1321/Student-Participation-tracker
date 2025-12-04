import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  Chip,
  Box,
  TextField,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
} from '@mui/material';
import { Add, Visibility, Delete, DeleteSweep, Assessment, Edit } from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const Events = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isStudent = user?.role === 'STUDENT';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventType: '',
    startDate: '',
    endDate: '',
    venue: '',
    eventLevel: '',
    maxParticipants: '',
    registrationLink: ''
  });
  const [filters, setFilters] = useState({
    eventType: '',
    status: '',
  });
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchDepartments();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/events', { params: filters });
      setEvents(response.data.data.events || []);
    } catch (error) {
      toast.error('Failed to fetch events');
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

  const handleOpenCreate = () => setOpenCreate(true);
  const handleCloseCreate = () => {
    setOpenCreate(false);
    setEventForm({
      title: '',
      description: '',
      eventType: '',
      startDate: '',
      endDate: '',
      venue: '',
      eventLevel: '',
      maxParticipants: '',
      registrationLink: ''
    });
  };

  const handleOpenEdit = (event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startDate: new Date(event.startDate).toISOString().slice(0, 16),
      endDate: new Date(event.endDate).toISOString().slice(0, 16),
      venue: event.venue,
      eventLevel: event.eventLevel || '',
      maxParticipants: event.maxParticipants?.toString() || '',
      registrationLink: event.registrationLink || ''
    });
    setOpenEdit(true);
  };

  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditingEvent(null);
    setEventForm({
      title: '',
      description: '',
      eventType: '',
      startDate: '',
      endDate: '',
      venue: '',
      eventLevel: '',
      maxParticipants: '',
      registrationLink: ''
    });
  };

  const handleSubmitCreate = async () => {
    try {
      const required = ['title', 'description', 'eventType', 'startDate', 'endDate', 'venue'];
      for (const k of required) {
        if (!eventForm[k]) return toast.error(`Please fill ${k}`);
      }
      const payload = {
        ...eventForm,
        maxParticipants: eventForm.maxParticipants ? Number(eventForm.maxParticipants) : undefined,
        startDate: new Date(eventForm.startDate),
        endDate: new Date(eventForm.endDate)
      };
      await api.post('/events', payload);
      toast.success('Event created');
      handleCloseCreate();
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleSubmitEdit = async () => {
    try {
      const required = ['title', 'description', 'eventType', 'startDate', 'endDate', 'venue'];
      for (const k of required) {
        if (!eventForm[k]) return toast.error(`Please fill ${k}`);
      }
      const payload = {
        ...eventForm,
        maxParticipants: eventForm.maxParticipants ? Number(eventForm.maxParticipants) : undefined,
        startDate: new Date(eventForm.startDate),
        endDate: new Date(eventForm.endDate)
      };
      await api.put(`/events/${editingEvent._id}`, payload);
      toast.success('Event updated successfully');
      handleCloseEdit();
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update event');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.delete(`/events/${id}`);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(events.map(e => e._id));
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
      toast.warning('Please select events to delete');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${selected.length} event(s)?`)) return;
    try {
      await Promise.all(selected.map(id => api.delete(`/events/${id}`)));
      toast.success(`${selected.length} event(s) deleted successfully`);
      setSelected([]);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete selected events');
    }
  };

  const handleDeleteFiltered = async () => {
    if (events.length === 0) {
      toast.warning('No events match the current filters');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all ${events.length} filtered event(s)?`)) return;
    try {
      await Promise.all(events.map(e => api.delete(`/events/${e._id}`)));
      toast.success(`${events.length} event(s) deleted successfully`);
      setSelected([]);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete filtered events');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      PUBLISHED: 'success',
      ONGOING: 'info',
      COMPLETED: 'warning',
      CANCELLED: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Events</Typography>
        {!isStudent && (
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
              disabled={events.length === 0}
            >
              Delete All Filtered ({events.length})
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenCreate}
            >
              Create Event
            </Button>
          </Box>
        )}
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Event Type"
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="HACKATHON">Hackathon</MenuItem>
              <MenuItem value="WORKSHOP">Workshop</MenuItem>
              <MenuItem value="SEMINAR">Seminar</MenuItem>
              <MenuItem value="COMPETITION">Competition</MenuItem>
              <MenuItem value="CONFERENCE">Conference</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="PUBLISHED">Published</MenuItem>
              <MenuItem value="ONGOING">Ongoing</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {!isStudent && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < events.length}
                    checked={events.length > 0 && selected.length === events.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              <TableCell>Event Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Venue</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Participants</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={isStudent ? 7 : 8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isStudent ? 7 : 8} align="center">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              events.map((event) => (
                <TableRow key={event._id} selected={!isStudent && selected.includes(event._id)}>
                  {!isStudent && (
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(event._id)}
                        onChange={() => handleSelectOne(event._id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>{event.title}</TableCell>
                  <TableCell>{event.eventType}</TableCell>
                  <TableCell>
                    {new Date(event.startDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{event.venue}</TableCell>
                  <TableCell>
                    <Chip
                      label={event.status}
                      color={getStatusColor(event.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {event.currentParticipants || 0} / {event.maxParticipants || 'Unlimited'}
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      startIcon={<Visibility />}
                      onClick={() => navigate(`/events/${event._id}`)}
                    >
                      View
                    </Button>
                    {!isStudent ? (
                      <>
                        <Button
                          size="small"
                          color="primary"
                          startIcon={<Edit />}
                          onClick={() => handleOpenEdit(event)}
                          sx={{ ml: 1 }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          color="info"
                          startIcon={<Assessment />}
                          onClick={() => navigate(`/events/${event._id}/analytics`)}
                          sx={{ ml: 1 }}
                        >
                          Analytics
                        </Button>
                        <Button 
                          size="small" 
                          color="error" 
                          startIcon={<Delete />} 
                          onClick={() => handleDelete(event._id)}
                          sx={{ ml: 1 }}
                        >
                          Delete
                        </Button>
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openCreate} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
        <DialogTitle>Create Event</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Title" value={eventForm.title} onChange={(e)=>setEventForm({...eventForm, title:e.target.value})} required />
            <TextField label="Description" multiline rows={3} value={eventForm.description} onChange={(e)=>setEventForm({...eventForm, description:e.target.value})} required />
            <TextField select label="Event Type" value={eventForm.eventType} onChange={(e)=>setEventForm({...eventForm, eventType:e.target.value})} required>
              <MenuItem value="HACKATHON">Hackathon</MenuItem>
              <MenuItem value="WORKSHOP">Workshop</MenuItem>
              <MenuItem value="SEMINAR">Seminar</MenuItem>
              <MenuItem value="COMPETITION">Competition</MenuItem>
              <MenuItem value="CONFERENCE">Conference</MenuItem>
            </TextField>
            <TextField label="Start Date" type="datetime-local" InputLabelProps={{ shrink: true }} value={eventForm.startDate} onChange={(e)=>setEventForm({...eventForm, startDate:e.target.value})} required />
            <TextField label="End Date" type="datetime-local" InputLabelProps={{ shrink: true }} value={eventForm.endDate} onChange={(e)=>setEventForm({...eventForm, endDate:e.target.value})} required />
            <TextField label="Venue" value={eventForm.venue} onChange={(e)=>setEventForm({...eventForm, venue:e.target.value})} required />
            <TextField select label="Event Level" value={eventForm.eventLevel} onChange={(e)=>setEventForm({...eventForm, eventLevel:e.target.value})}>
              <MenuItem value="">Not Specified</MenuItem>
              <MenuItem value="INTRA_COLLEGE">Intra College</MenuItem>
              <MenuItem value="INTER_COLLEGE">Inter College</MenuItem>
              <MenuItem value="NATIONAL">National</MenuItem>
              <MenuItem value="INTERNATIONAL">International</MenuItem>
            </TextField>
            <TextField label="Max Participants" type="number" value={eventForm.maxParticipants} onChange={(e)=>setEventForm({...eventForm, maxParticipants:e.target.value})} inputProps={{ min: 1 }} />
            <TextField label="Registration Link (Optional)" placeholder="https://forms.google.com/..." value={eventForm.registrationLink} onChange={(e)=>setEventForm({...eventForm, registrationLink:e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEdit} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Event</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gap: 2, mt: 1 }}>
            <TextField label="Title" value={eventForm.title} onChange={(e)=>setEventForm({...eventForm, title:e.target.value})} required />
            <TextField label="Description" multiline rows={3} value={eventForm.description} onChange={(e)=>setEventForm({...eventForm, description:e.target.value})} required />
            <TextField select label="Event Type" value={eventForm.eventType} onChange={(e)=>setEventForm({...eventForm, eventType:e.target.value})} required>
              <MenuItem value="HACKATHON">Hackathon</MenuItem>
              <MenuItem value="WORKSHOP">Workshop</MenuItem>
              <MenuItem value="SEMINAR">Seminar</MenuItem>
              <MenuItem value="COMPETITION">Competition</MenuItem>
              <MenuItem value="CONFERENCE">Conference</MenuItem>
            </TextField>
            <TextField label="Start Date" type="datetime-local" InputLabelProps={{ shrink: true }} value={eventForm.startDate} onChange={(e)=>setEventForm({...eventForm, startDate:e.target.value})} required />
            <TextField label="End Date" type="datetime-local" InputLabelProps={{ shrink: true }} value={eventForm.endDate} onChange={(e)=>setEventForm({...eventForm, endDate:e.target.value})} required />
            <TextField label="Venue" value={eventForm.venue} onChange={(e)=>setEventForm({...eventForm, venue:e.target.value})} required />
            <TextField select label="Event Level" value={eventForm.eventLevel} onChange={(e)=>setEventForm({...eventForm, eventLevel:e.target.value})}>
              <MenuItem value="">Not Specified</MenuItem>
              <MenuItem value="INTRA_COLLEGE">Intra College</MenuItem>
              <MenuItem value="INTER_COLLEGE">Inter College</MenuItem>
              <MenuItem value="NATIONAL">National</MenuItem>
              <MenuItem value="INTERNATIONAL">International</MenuItem>
            </TextField>
            <TextField label="Max Participants" type="number" value={eventForm.maxParticipants} onChange={(e)=>setEventForm({...eventForm, maxParticipants:e.target.value})} inputProps={{ min: 1 }} />
            <TextField label="Registration Link (Optional)" placeholder="https://forms.google.com/..." value={eventForm.registrationLink} onChange={(e)=>setEventForm({...eventForm, registrationLink:e.target.value})} />
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

export default Events;
