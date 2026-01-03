import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/user/current`,
          { withCredentials: true }
        );
        dispatch(setUserData(res.data));
      } catch (error) {
        // ✅ 401 IS NORMAL (logged out / incognito)
        if (error.response?.status === 401) {
          dispatch(setUserData(null));
          return;
        }

        // real errors only
        console.error("Current user error:", error);
        dispatch(setUserData(null));
      }
    };

    fetchUser();
  }, [dispatch]);
};

export default useGetCurrentUser;
