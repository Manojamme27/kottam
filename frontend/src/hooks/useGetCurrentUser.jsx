import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import {
  setUserData,
  setAuthChecked,
  logout,
} from "../redux/userSlice";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Load cached user immediately (for better UX)
    const cachedUser = localStorage.getItem("userData");

    if (cachedUser) {
      try {
        dispatch(setUserData(JSON.parse(cachedUser)));
      } catch (err) {
        localStorage.removeItem("userData");
      }
    }

    // Allow UI to render immediately
    dispatch(setAuthChecked(true));

    // Verify session in the background
    axios
      .get(`${serverUrl}/api/user/current-user`, {
        withCredentials: true,
      })
      .then((res) => {
        localStorage.setItem("userData", JSON.stringify(res.data));
        dispatch(setUserData(res.data));
      })
      .catch(() => {
        // Session is invalid or user no longer exists
        localStorage.removeItem("userData");
        dispatch(logout());
      });
  }, [dispatch]);
};

export default useGetCurrentUser;