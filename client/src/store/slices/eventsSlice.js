import { createSlice } from '@reduxjs/toolkit';

const eventsSlice = createSlice({
  name: 'events',
  initialState: {
    events: [],
    selectedEvent: null,
    loading: false,
    error: null,
  },
  reducers: {
    setEvents: (state, action) => {
      state.events = action.payload;
    },
    setSelectedEvent: (state, action) => {
      state.selectedEvent = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setEvents, setSelectedEvent, setLoading, setError } = eventsSlice.actions;
export default eventsSlice.reducer;
