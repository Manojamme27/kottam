import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setUserData, setAuthChecked, logout } from "../redux/userSlice";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // 🔥 STEP 1: TRUST LOCAL STORAGE IMMEDIATELY
    const cachedUser = localStorage.getItem("userData");

    if (cachedUser) {
      dispatch(setUserData(JSON.parse(cachedUser)));
    }

    // UI is allowed to render NOW
    dispatch(setAuthChecked(true));

    // 🔥 STEP 2: VERIFY SESSION IN BACKGROUND
    axios
      .get(`${serverUrl}/api/user/current-user`, {
        withCredentials: true,
      })
      .then((res) => {
        dispatch(setUserData(res.data));
      })
      .catch(() => {
        // ❌ do NOT block UI
        // optional: logout silently if needed
        // dispatch(logout());
      });

  }, [dispatch]);
};

export default useGetCurrentUser;
