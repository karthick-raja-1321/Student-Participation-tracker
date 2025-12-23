import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Toolbar,
  Typography,
  Avatar,
} from '@mui/material';
import {
  Dashboard,
  Event,
  Assignment,
  CheckCircle,
  Assessment,
  People,
  School,
  Business,
  CloudUpload,
  Settings,
  PersonSearch,
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';

const drawerWidth = 260;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY', 'STUDENT'], color: '#1976d2' },
    { text: 'Events', icon: <Event />, path: '/events', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY', 'STUDENT'], color: '#9c27b0' },
    { text: 'Submissions', icon: <Assignment />, path: '/submissions', roles: ['SUPER_ADMIN', 'STUDENT', 'FACULTY', 'HOD'], color: '#f57c00' },
    { text: 'Mentorship', icon: <PersonSearch />, path: '/mentorship', roles: ['FACULTY'], color: '#00897b' },
    { text: 'Approvals', icon: <CheckCircle />, path: '/approvals', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY'], color: '#388e3c' },
    { text: 'Reports', icon: <Assessment />, path: '/reports', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY'], color: '#d32f2f' },
    { text: 'Students', icon: <School />, path: '/students', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY'], color: '#0288d1' },
    { text: 'Faculty', icon: <People />, path: '/faculty', roles: ['SUPER_ADMIN', 'HOD'], color: '#7b1fa2' },
    { text: 'Departments', icon: <Business />, path: '/departments', roles: ['SUPER_ADMIN'], color: '#5d4037' },
    { text: 'Excel Import', icon: <CloudUpload />, path: '/excel', roles: ['SUPER_ADMIN'], color: '#00796b' },
    { text: 'Settings', icon: <Settings />, path: '/settings', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY', 'STUDENT'], color: '#616161' },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      background: '#1a237e !important',
      color: 'white'
    }}>
      <Toolbar>
        <Box sx={{ 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          py: 2,
          gap: 1
        }}>
          <Avatar
            sx={{ 
              width: 60, 
              height: 60, 
              bgcolor: '#fff',
              color: '#1976d2',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}
          >
            {user?.firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center' }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="caption" sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            px: 2, 
            py: 0.5, 
            borderRadius: 2,
            fontSize: '0.7rem',
            fontWeight: 500
          }}>
            {user?.role}
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.12)' }} />
      <List sx={{ px: 1, pt: 2 }}>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  bgcolor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    transform: 'translateX(4px)',
                    transition: 'all 0.2s ease'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: isActive ? '#fff' : item.color,
                    minWidth: 40,
                    '& svg': {
                      filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
                    }
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    color: 'white',
                    '& .MuiListItemText-primary': {
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.95rem'
                    }
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            border: 'none',
            background: '#1a237e !important',
            color: '#fff',
            marginTop: (theme) => `${theme.mixins.toolbar.minHeight}px`,
            height: (theme) => `calc(100% - ${theme.mixins.toolbar.minHeight}px)`
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            border: 'none',
            boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
            background: '#1a237e !important',
            color: '#fff',
            marginTop: (theme) => `${theme.mixins.toolbar.minHeight}px`,
            height: (theme) => `calc(100% - ${theme.mixins.toolbar.minHeight}px)`
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
