import { useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { serverUrl } from "../App";

const useUpdateLocation = () => {
  const { userData } = useSelector(state => state.user);
if (!userData?._id) return;

  useEffect(() => {
    // ✅ HARD GUARDS — VERY IMPORTANT
    if (!userData?._id) return;
    if (!userData?.location?.coordinates) return;

    const [lng, lat] = userData.location.coordinates;

    // ✅ FIRE AND FORGET — NEVER BREAK UI
    axios.post (
      `${serverUrl}/api/user/update-location`,
      { latitude: lat, longitude: lng },
      { withCredentials: true }
    ).catch(() => {
      // ❌ DO NOTHING — THIS MUST BE SILENT
    });

  }, [userData?._id]);
};

export default useUpdateLocation;



