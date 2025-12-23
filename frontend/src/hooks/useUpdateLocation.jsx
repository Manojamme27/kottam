import axios from "axios";
import { useEffect, useRef } from "react";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";

function useUpdateLocation() {
  const { userData } = useSelector((state) => state.user);
  const lastLocationRef = useRef(null);

  useEffect(() => {
    if (!userData) return;

    const updateLocation = async (lat, lon) => {
      try {
        await axios.post(
          `${serverUrl}/api/user/update-location`,
          {
            latitude: lat,
            longitude: lon,
          },
          { withCredentials: true }
        );
      } catch (error) {
        if (error.response?.data?.message !== "token not found") {
          console.log("Update location error:", error);
        }
      }
    };

    const watcher = navigator.geolocation.watchPosition((pos) => {
      const { latitude, longitude } = pos.coords;

      // 🛑 prevent spam updates
      if (lastLocationRef.current) {
        const { lat, lon } = lastLocationRef.current;
        const diff =
          Math.abs(lat - latitude) + Math.abs(lon - longitude);
        if (diff < 0.0005) return; // ~50m
      }

      lastLocationRef.current = {
        lat: latitude,
        lon: longitude,
      };

      updateLocation(latitude, longitude);
    });

    return () => navigator.geolocation.clearWatch(watcher);
  }, [userData]);
}

export default useUpdateLocation;
