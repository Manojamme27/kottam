import { useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { serverUrl } from "../App";

const useUpdateLocation = () => {
  const { userData, authChecked } = useSelector(state => state.user);

  useEffect(() => {
    // 🛑 HARD GUARDS
    if (!authChecked) return;
    if (!userData?._id) return;
    if (!userData?.location?.coordinates) return;

    const [lon, lat] = userData.location.coordinates;

    axios.post(
      `${serverUrl}/api/user/update-location`,
      { lat, lon },                 // ✅ CORRECT PAYLOAD
      { withCredentials: true }
    ).catch(err => {
      // ❌ 401 is expected → ignore
      if (err.response?.status !== 401) {
        console.error("update-location error:", err);
      }
    });
  }, [authChecked, userData?._id]);
};

export default useUpdateLocation;
