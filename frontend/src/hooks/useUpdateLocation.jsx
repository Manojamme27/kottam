import { useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { serverUrl } from "../App";

const useUpdateLocation = () => {
  const { userData, authChecked } = useSelector(state => state.user);

  useEffect(() => {
    // ⛔ wait until auth check completes
    if (!authChecked) return;

    // ⛔ user not logged in
    if (!userData?._id) return;

    // ⛔ no location available
    if (!userData?.location?.coordinates) return;

    const [lng, lat] = userData.location.coordinates;

    // ✅ fire-and-forget (never break UI)
    axios
      .post(
        `${serverUrl}/api/user/update-location`,
        { latitude: lat, longitude: lng },
        { withCredentials: true }
      )
      .catch(() => {
        // intentionally silent
      });
  }, [authChecked, userData?._id, userData?.location?.coordinates]);
};

export default useUpdateLocation;
