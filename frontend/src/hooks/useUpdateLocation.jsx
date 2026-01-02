import { useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { serverUrl } from "../App";

const useUpdateLocation = () => {
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData?._id) return;
    if (!userData?.location?.coordinates) return;

    const [lng, lat] = userData.location.coordinates;

    axios.post(
      `${serverUrl}/api/user/update-location`,
      {
        latitude: lat,
        longitude: lng,
      },
      { withCredentials: true }
    ).catch(() => {
      // silent fail (do NOT break UI)
    });
  }, [userData?._id]);
};

export default useUpdateLocation;
