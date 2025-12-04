import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Notifications,
  AccountCircle,
  Menu as MenuIcon,
  Settings,
  Logout,
  Person,
  Circle,
} from '@mui/icons-material';
import Sidebar from './Sidebar';
import { logout } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';
import api from '../../utils/api';

const MainLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      setUnreadCount(response.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      setUnreadCount(0);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications?limit=5');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotifOpen = async (event) => {
    setNotifAnchorEl(event.currentTarget);
    await fetchNotifications();
  };

  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark notifications as read');
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await api.put(`/notifications/${notification._id}/read`);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(notifications.map(n => 
          n._id === notification._id ? { ...n, isRead: true } : n
        ));
      }
      handleNotifClose();
      // Navigate based on notification type if needed
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleViewAllNotifications = () => {
    handleNotifClose();
    navigate('/notifications');
  };

  const handleProfile = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleSettings = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleLogout = () => {
    handleMenuClose();
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <img 
              src="/logo.png" 
              alt="Institution Logo" 
              style={{ height: '40px', marginRight: '16px', objectFit: 'contain' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <Typography variant="h6" noWrap component="div">
              Student Participation Tracker
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={handleNotifOpen}>
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <AccountCircle />
          </IconButton>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { width: 350, maxHeight: 400 }
            }}
          >
            <MenuItem disabled>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                Notifications
              </Typography>
            </MenuItem>
            <Divider />
            {notifications.length === 0 ? (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  No notifications
                </Typography>
              </MenuItem>
            ) : (
              notifications.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  sx={{
                    bgcolor: notif.isRead ? 'inherit' : 'action.hover',
                    whiteSpace: 'normal',
                    py: 1.5
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 30 }}>
                    {!notif.isRead && <Circle sx={{ fontSize: 10, color: 'primary.main' }} />}
                  </ListItemIcon>
                  <ListItemText
                    primary={notif.title}
                    secondary={notif.message}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: notif.isRead ? 'normal' : 'bold' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                </MenuItem>
              ))
            )}
            {notifications.length > 0 && (
              <>
                <Divider />
                <MenuItem onClick={handleMarkAllRead}>
                  <Typography variant="body2" color="primary">Mark All as Read</Typography>
                </MenuItem>
              </>
            )}
            <Divider />
            <MenuItem onClick={handleViewAllNotifications}>
              <Typography variant="body2" color="primary">View All Notifications</Typography>
            </MenuItem>
          </Menu>

          {/* User Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.firstName} {user?.lastName}
              </Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                {user?.email}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <Person fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={handleSettings}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          width: { sm: `calc(100% - 240px)` }
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;
