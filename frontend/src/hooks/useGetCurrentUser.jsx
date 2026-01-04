import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData, setAuthChecked } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/auth/me`, // 🔥 FIXED ENDPOINT
          { withCredentials: true }
        );

        dispatch(setUserData(res.data));
      } catch (error) {
        // 🔥 DO NOT LOG USER OUT ON 400
        if (error.response?.status === 401) {
          dispatch(setUserData(null));
        }
      } finally {
        dispatch(setAuthChecked(true));
      }
    };

    fetchUser();
  }, [dispatch]);
};

export default useGetCurrentUser;
