import { useEffect } from "react";
import { useSelector } from "react-redux";
import api from "../axios";

const useUpdateLocation = () => {
  const { userData, authChecked } = useSelector((state) => state.user);

  useEffect(() => {
    if (!authChecked) return;
    if (!userData?._id) return;
    if (!userData?.location?.coordinates?.length) return;

    const [lon, lat] = userData.location.coordinates;

    // 🔥 NON-BLOCKING, SAFE CALL
    api
      .post("/api/user/update-location", {
        latitude: lat,
        longitude: lon,
      })
      .catch(() => {
        // handled globally in axios interceptor
      });
  }, [
    authChecked,
    userData?._id,
    userData?.location?.coordinates?.[0],
    userData?.location?.coordinates?.[1],
  ]);
};

export default useUpdateLocation;
