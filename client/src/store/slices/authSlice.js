import { createSlice } from '@reduxjs/toolkit';

// Guarded helpers to survive disabled/unavailable storage (e.g., incognito if blocked)
const safeGet = (key) => {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
};

const safeParse = (key) => {
  try {
    const value = safeGet(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    // If stored data is corrupted, clear it so the app can continue
    try { localStorage.removeItem(key); } catch (_) {}
    return null;
  }
};

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    // ignore when storage is blocked
  }
};

const safeRemove = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    // ignore when storage is blocked
  }
};

const initialState = {
  user: safeParse('user'),
  token: safeGet('token') || null,
  refreshToken: safeGet('refreshToken') || null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      safeSet('user', JSON.stringify(action.payload.user));
      safeSet('token', action.payload.token);
      safeSet('refreshToken', action.payload.refreshToken);
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      safeRemove('user');
      safeRemove('token');
      safeRemove('refreshToken');
    },
    updateUser: (state, action) => {
      state.user = action.payload;
      safeSet('user', JSON.stringify(action.payload));
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
