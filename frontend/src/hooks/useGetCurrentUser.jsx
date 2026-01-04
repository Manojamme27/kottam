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
          `${serverUrl}/api/user/current-user`,
          { withCredentials: true }
        );
        dispatch(setUserData(res.data));
      } catch {
        dispatch(setUserData(null));
      } finally {
        dispatch(setAuthChecked(true)); // ⭐ CRITICAL
      }
    };

    fetchUser();
  }, [dispatch]);
};

export default useGetCurrentUser;
