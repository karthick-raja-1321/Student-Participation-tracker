import React, { createContext, useEffect, useMemo, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from './store';
import AppRoutes from './routes';
import './App.css';

export const ColorModeContext = createContext({ mode: 'light', toggleColorMode: () => {} });

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('themeMode') || 'light');

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const colorMode = useMemo(() => ({
    mode,
    toggleColorMode: () => setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
  }), [mode]);

  const theme = useMemo(() => {
    const paletteConfig = {
      mode,
      primary: {
        main: '#1976D2',
        dark: '#115293',
        light: '#4791DB',
      },
      secondary: {
        main: '#2E7D32',
        dark: '#1B5E20',
        light: '#4CAF50',
      },
      error: {
        main: '#D32F2F',
      },
      warning: {
        main: '#FF9800',
      },
      info: {
        main: '#2196F3',
      },
      success: {
        main: '#4CAF50',
      },
    };

    if (mode === 'dark') {
      paletteConfig.background = { default: '#1a1f4d', paper: '#2d2e5f' };
      paletteConfig.text = { primary: '#e6e9f2', secondary: '#b6bed3' };
    } else {
      paletteConfig.background = { default: '#f5f7fb', paper: '#ffffff' };
    }

    return createTheme({
      palette: paletteConfig,
      typography: {
        fontFamily: '"Roboto", "Segoe UI", sans-serif',
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              backgroundImage: 'none',
            },
          },
        },
      },
    });
  }, [mode]);

  return (
    <Provider store={store}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ColorModeContext.Provider value={colorMode}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppRoutes />
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme={mode === 'dark' ? 'dark' : 'light'}
            />
          </ThemeProvider>
        </ColorModeContext.Provider>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
