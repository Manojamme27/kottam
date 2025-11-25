import axios from 'axios';
import React, { useEffect } from 'react';
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import {
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
} from '../redux/userSlice.js';
import { setAddress, setLocation } from '../redux/mapSlice';

function useGetCity() {
  const dispatch = useDispatch();
  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  useEffect(() => {
    const fetchLocation = () => {
      if (!navigator.geolocation) {
        console.warn("⚠️ Geolocation not supported, using IP fallback.");
        fetchFallbackLocation();
        return;
      }

      const success = async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        console.log("📍 Position received:", latitude, longitude);

        dispatch(setLocation({ lat: latitude, lon: longitude }));

        try {
          const result = await axios.get(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${latitude}&lon=${longitude}&format=json&apiKey=${apiKey}`
          );

          const data = result.data.results?.[0];
          dispatch(setCurrentCity(data?.city || data?.county || "Unknown"));
          dispatch(setCurrentState(data?.state || ""));
          dispatch(setCurrentAddress(data?.address_line2 || data?.address_line1));
          dispatch(setAddress(data?.address_line2 || data?.address_line1));
          console.log("✅ User location updated");
        } catch (err) {
          console.error("⚠️ Reverse geocoding failed:", err);
        }
      };

      const error = (err) => {
        console.error("❌ Error getting location:", err);
        if (err.code === 3) {
          console.log("⌛ Timeout — retrying with lower accuracy...");
        }
        fetchFallbackLocation();
      };

      navigator.geolocation.getCurrentPosition(success, error, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 10000,
      });
    };

    const fetchFallbackLocation = async () => {
      try {
        const res = await axios.get("https://ipapi.co/json/");
        const { latitude, longitude, city, region, country_name } = res.data;

        dispatch(setLocation({ lat: latitude, lon: longitude }));
        dispatch(setCurrentCity(city || ""));
        dispatch(setCurrentState(region || ""));
        dispatch(setCurrentAddress(`${city}, ${region}, ${country_name}`));
        dispatch(setAddress(`${city}, ${region}, ${country_name}`));

        console.log("✅ Fallback location (IP) updated");
      } catch (err) {
        console.error("❌ Fallback IP geolocation failed:", err);
      }
    };

    fetchLocation();
  }, [dispatch]);
}

export default useGetCity;
