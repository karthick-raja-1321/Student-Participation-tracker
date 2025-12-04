import React from 'react';
import { Box, Container } from '@mui/material';

const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1976D2 0%, #2E7D32 100%)',
      }}
    >
      <Container maxWidth="sm">
        {children}
      </Container>
    </Box>
  );
};

export default AuthLayout;
