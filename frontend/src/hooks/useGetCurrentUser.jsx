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

        // ✅ ONLY set user when SUCCESS
        dispatch(setUserData(res.data));
      } catch (error) {
        // ❌ DO NOTHING HERE
        // ❌ NEVER clear user on refresh
        console.warn("Auth check failed, keeping existing user");
      } finally {
        // ✅ auth check finished (success or fail)
        dispatch(setAuthChecked(true));
      }
    };

    fetchUser();
  }, [dispatch]);
};

export default useGetCurrentUser;
