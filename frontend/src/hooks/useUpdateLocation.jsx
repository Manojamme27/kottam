import { useEffect, useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { serverUrl } from "../App";

const useUpdateLocation = () => {
  const { userData, authChecked } = useSelector(state => state.user);

  const disabledRef = useRef(false); // 🔥 NEW

  useEffect(() => {
    if (disabledRef.current) return;   // 🔥 STOP forever after 401
    if (!authChecked) return;
    if (!userData?._id) return;
    if (!userData?.location?.coordinates) return;

    const [lon, lat] = userData.location.coordinates;

    axios.post(
      `${serverUrl}/api/user/update-location`,
      { latitude: lat, longitude: lon },
      { withCredentials: true }
    ).catch(err => {
      if (err.response?.status === 401) {
        console.warn("Session expired — disabling location updates");
        disabledRef.current = true; // 🔥 HARD STOP
        return;
      }

      console.error("update-location error:", err);
    });
  }, [
    authChecked,
    userData?._id,
    userData?.location?.coordinates?.[0],
    userData?.location?.coordinates?.[1],
  ]);
};

export default useUpdateLocation;
