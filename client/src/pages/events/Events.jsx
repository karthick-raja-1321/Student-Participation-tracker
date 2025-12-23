import React, { useState, useEffect, useMemo } from 'react';
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
  const [customEventTypes, setCustomEventTypes] = useState([]);
  const [newEventTypeInput, setNewEventTypeInput] = useState('');
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    eventType: '',
    startDate: '',
    endDate: '',
    venue: '',
    organizerName: '',
    eventLevel: '',
    maxParticipants: '',
    registrationLink: ''
  });
  const [filters, setFilters] = useState({
    eventName: '',
    eventType: '',
    status: '', // '', 'ONGOING', 'COMPLETED' per UI category requirements
  });
  const [selected, setSelected] = useState([]);

  // Build dynamic list of event types from existing events + custom additions
  const eventTypesFromData = useMemo(() => {
    const types = new Set(events
      .map(e => (e.eventType || '').toString().trim().toUpperCase())
      .filter(Boolean));
    return Array.from(types);
  }, [events]);

  const allEventTypes = useMemo(() => {
    const merged = new Set([...eventTypesFromData, ...customEventTypes.map(t => t.toUpperCase())]);
    return Array.from(merged).sort();
  }, [eventTypesFromData, customEventTypes]);

  const addNewEventType = () => {
    const val = (newEventTypeInput || '').trim().toUpperCase();
    if (!val) return;
    if (!customEventTypes.map(t => t.toUpperCase()).includes(val)) {
      setCustomEventTypes(prev => [...prev, val]);
    }
    setNewEventTypeInput('');
  };

  const handleAddTypeToForm = (type) => {
    setEventForm({ ...eventForm, eventType: type });
  };

  useEffect(() => {
    fetchEvents();
    fetchDepartments();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // Fetch all events, apply filters client-side for consistent UX
      const response = await api.get('/events');
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
      organizerName: '',
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
      organizerName: event.organizerName || '',
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
      organizerName: '',
      eventLevel: '',
      maxParticipants: '',
      registrationLink: ''
    });
  };

  const handleSubmitCreate = async () => {
    try {
      const required = ['title', 'description', 'eventType', 'startDate', 'endDate', 'venue', 'organizerName'];
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
      const required = ['title', 'description', 'eventType', 'startDate', 'endDate', 'venue', 'organizerName'];
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
      setSelected(filteredEvents.map(e => e._id));
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
    if (filteredEvents.length === 0) {
      toast.warning('No events match the current filters');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all ${filteredEvents.length} filtered event(s)?`)) return;
    try {
      await Promise.all(filteredEvents.map(e => api.delete(`/events/${e._id}`)));
      toast.success(`${filteredEvents.length} event(s) deleted successfully`);
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

  // Helpers to determine registration windows for category filtering
  const isRegistrationOpen = (e) => {
    const now = Date.now();
    const deadline = e.registrationDeadline ? new Date(e.registrationDeadline).getTime() : null;
    const end = e.endDate ? new Date(e.endDate).getTime() : null;
    // Consider open if: explicit deadline in future OR event status is ONGOING OR start/end not passed yet
    if (deadline && deadline >= now) return true;
    if (e.status === 'ONGOING') return true;
    // Fallback: before event end date
    if (end && end >= now) return true;
    return false;
  };

  const isRegistrationClosed = (e) => {
    const now = Date.now();
    const deadline = e.registrationDeadline ? new Date(e.registrationDeadline).getTime() : null;
    const end = e.endDate ? new Date(e.endDate).getTime() : null;
    if (e.status === 'COMPLETED' || e.status === 'CANCELLED') return true;
    if (deadline && deadline < now) return true;
    if (end && end < now) return true;
    return false;
  };

  const filteredEvents = useMemo(() => {
    let list = Array.isArray(events) ? [...events] : [];

    // Name filter
    if (filters.eventName?.trim()) {
      const q = filters.eventName.trim().toLowerCase();
      list = list.filter(e => (e.title || '').toLowerCase().includes(q));
    }

    // Type filter
    if (filters.eventType) {
      const t = filters.eventType.toUpperCase();
      list = list.filter(e => (e.eventType || '').toString().trim().toUpperCase() === t);
    }

    // Status category filter per requirements
    if (filters.status === 'ONGOING') {
      list = list.filter(isRegistrationOpen);
    } else if (filters.status === 'COMPLETED') {
      list = list.filter(isRegistrationClosed);
    }

    return list;
  }, [events, filters]);

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
              disabled={filteredEvents.length === 0}
            >
              Delete All Filtered ({filteredEvents.length})
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
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Event Name"
              placeholder="Enter event name"
              value={filters.eventName || ''}
              onChange={(e) => setFilters({ ...filters, eventName: e.target.value })}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Event Type"
              value={filters.eventType}
              onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
            >
              <MenuItem value="">All Types</MenuItem>
              {allEventTypes.map(type => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="ONGOING">Ongoing</MenuItem>
              <MenuItem value="COMPLETED">Completed</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              {!isStudent && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < filteredEvents.length}
                    checked={filteredEvents.length > 0 && selected.length === filteredEvents.length}
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
            ) : filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isStudent ? 7 : 8} align="center">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
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
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>Event Type</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {allEventTypes.map(type => (
                  <Button
                    key={type}
                    size="small"
                    variant={eventForm.eventType === type ? 'contained' : 'outlined'}
                    onClick={() => handleAddTypeToForm(type)}
                  >
                    {type}
                  </Button>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="e.g., WEBINAR"
                  value={newEventTypeInput}
                  onChange={(e) => setNewEventTypeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewEventType()}
                  sx={{ flex: 1 }}
                />
                <Button size="small" variant="outlined" onClick={addNewEventType}>Add Type</Button>
              </Box>
            </Box>
            <TextField label="Organizer Name" value={eventForm.organizerName} onChange={(e)=>setEventForm({...eventForm, organizerName:e.target.value})} required />
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
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>Event Type</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {allEventTypes.map(type => (
                  <Button
                    key={type}
                    size="small"
                    variant={eventForm.eventType === type ? 'contained' : 'outlined'}
                    onClick={() => handleAddTypeToForm(type)}
                  >
                    {type}
                  </Button>
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="e.g., WEBINAR"
                  value={newEventTypeInput}
                  onChange={(e) => setNewEventTypeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewEventType()}
                  sx={{ flex: 1 }}
                />
                <Button size="small" variant="outlined" onClick={addNewEventType}>Add Type</Button>
              </Box>
            </Box>
            <TextField label="Organizer Name" value={eventForm.organizerName} onChange={(e)=>setEventForm({...eventForm, organizerName:e.target.value})} required />
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
