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
  if (error?.response?.status === 401) {
    // ✅ Normal for guest / incognito users
    dispatch(setUserData(null));
    return;
  }

  console.error("Unexpected current user error:", error);
}

    };

    fetchUser();
  }, [dispatch]);
};

export default useGetCurrentUser;

