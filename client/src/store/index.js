import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import eventsReducer from './slices/eventsSlice';
import submissionsReducer from './slices/submissionsSlice';
import notificationsReducer from './slices/notificationsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    events: eventsReducer,
    submissions: submissionsReducer,
    notifications: notificationsReducer,
  },
});

export default store;
