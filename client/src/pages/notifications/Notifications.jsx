import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Tabs,
  Tab,
  Box,
  Divider,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Circle,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter === 'unread') params.unreadOnly = true;
      if (filter === 'read') params.readOnly = true;
      
      const { data } = await api.get('/notifications', { params });
      setNotifications(data.notifications || []);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      toast.success('Notification marked as read');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }

    // Navigate based on notification type and relatedModel
    if (notification.relatedModel && notification.relatedId) {
      switch (notification.relatedModel) {
        case 'PhaseISubmission':
          navigate(`/submissions/phase-i`);
          break;
        case 'PhaseIISubmission':
          navigate(`/submissions/phase-ii`);
          break;
        case 'Event':
          navigate(`/events`);
          break;
        case 'EventRegistration':
          navigate(`/approvals`);
          break;
        default:
          break;
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'APPROVAL_PENDING':
        return <AccessTimeIcon color="warning" />;
      case 'APPROVAL_APPROVED':
      case 'APPROVAL_REJECTED':
        return <CheckCircleIcon color={type === 'APPROVAL_APPROVED' ? 'success' : 'error'} />;
      case 'DEADLINE_REMINDER':
        return <AccessTimeIcon color="info" />;
      default:
        return <Circle sx={{ fontSize: 10, color: 'primary.main' }} />;
    }
  };

  const unreadCount = (notifications || []).filter(n => !n.isRead).length;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Notifications
            {unreadCount > 0 && (
              <Chip 
                label={`${unreadCount} unread`} 
                color="primary" 
                size="small" 
                sx={{ ml: 2 }} 
              />
            )}
          </Typography>
          {notifications.length > 0 && unreadCount > 0 && (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleMarkAllRead}
              startIcon={<CheckCircleIcon />}
            >
              Mark All as Read
            </Button>
          )}
        </Box>

        <Tabs value={filter} onChange={(e, newValue) => setFilter(newValue)} sx={{ mb: 2 }}>
          <Tab label="All" value="all" />
          <Tab label="Unread" value="unread" />
          <Tab label="Read" value="read" />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate(-1)}
            >
              Close
            </Button>
          </Box>
        ) : (
          <List>
            {notifications.map((notification, index) => (
              <Box key={notification._id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{
                    bgcolor: notification.isRead ? 'inherit' : 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                    cursor: 'pointer',
                    py: 2
                  }}
                  secondaryAction={
                    <>
                      {!notification.isRead && (
                        <IconButton
                          edge="end"
                          aria-label="mark as read"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id);
                          }}
                          sx={{ mr: 1 }}
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification._id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }
                  onClick={() => handleNotificationClick(notification)}
                >
                  <ListItemIcon>
                    {getNotificationIcon(notification.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default Notifications;
