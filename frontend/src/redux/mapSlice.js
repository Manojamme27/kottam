import { createSlice } from "@reduxjs/toolkit";

const mapSlice = createSlice({
  name: "map", // ✅ FIXED
  initialState: {
    location: {
      lat: null,
      lon: null,
    },
    address: null,
  },
  reducers: {
    setLocation: (state, action) => {
      const { lat, lon } = action.payload || {};
      state.location.lat = lat ?? null;
      state.location.lon = lon ?? null;
    },
    setAddress: (state, action) => {
      state.address = action.payload ?? null;
    },
  },
});

export const { setAddress, setLocation } = mapSlice.actions;
export default mapSlice.reducer;
