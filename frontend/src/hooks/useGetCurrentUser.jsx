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
      } catch (error) {
        // ❌ DO NOT clear user for 401 here on refresh
        dispatch(setUserData(null));
      } finally {
        dispatch(setAuthChecked(true));
      }
    };

    fetchUser();
  }, [dispatch]);
};

export default useGetCurrentUser;

