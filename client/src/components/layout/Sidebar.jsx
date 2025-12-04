import React from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';

const drawerWidth = 240;

const Sidebar = ({ mobileOpen, handleDrawerToggle }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY', 'STUDENT'] },
    { text: 'Events', icon: <Event />, path: '/events', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY', 'STUDENT'] },
    { text: 'Submissions', icon: <Assignment />, path: '/submissions', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY', 'STUDENT'] },
    { text: 'Approvals', icon: <CheckCircle />, path: '/approvals', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY'] },
    { text: 'Reports', icon: <Assessment />, path: '/reports', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY'] },
    { text: 'Students', icon: <School />, path: '/students', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY'] },
    { text: 'Faculty', icon: <People />, path: '/faculty', roles: ['SUPER_ADMIN', 'HOD'] },
    { text: 'Departments', icon: <Business />, path: '/departments', roles: ['SUPER_ADMIN'] },
    { text: 'Excel Import', icon: <CloudUpload />, path: '/excel', roles: ['SUPER_ADMIN', 'HOD'] },
    { text: 'Settings', icon: <Settings />, path: '/settings', roles: ['SUPER_ADMIN', 'HOD', 'FACULTY', 'STUDENT'] },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  const drawer = (
    <div>
      <Toolbar>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', py: 1 }}>
          <img 
            src="/logo.png" 
            alt="Institution Logo" 
            style={{ height: '50px', objectFit: 'contain' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </Box>
      </Toolbar>
      <Divider />
      <List>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
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
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
