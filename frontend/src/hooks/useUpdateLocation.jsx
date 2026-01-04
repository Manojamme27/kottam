import { useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { serverUrl } from "../App";

const useUpdateLocation = () => {
  const { userData, authChecked } = useSelector(state => state.user);

  useEffect(() => {
    if (!authChecked) return;
    if (!userData?._id) return;
    if (!userData?.location?.coordinates) return;

    const [lng, lat] = userData.location.coordinates;

    axios.post(
      `${serverUrl}/api/user/update-location`,
      { latitude: lat, longitude: lng },
      { withCredentials: true }
    ).catch(() => {});
  }, [authChecked, userData?._id]);
};

export default useUpdateLocation;
