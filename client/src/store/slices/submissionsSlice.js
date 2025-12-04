import { createSlice } from '@reduxjs/toolkit';

const submissionsSlice = createSlice({
  name: 'submissions',
  initialState: {
    submissions: [],
    loading: false,
    error: null,
  },
  reducers: {
    setSubmissions: (state, action) => {
      state.submissions = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setSubmissions, setLoading, setError } = submissionsSlice.actions;
export default submissionsSlice.reducer;
