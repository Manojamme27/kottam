import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { setUserData, setAuthChecked } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // ✅ 1. INSTANT UI FROM CACHE
    const cachedUser = localStorage.getItem("userData");
    if (cachedUser) {
      dispatch(setUserData(JSON.parse(cachedUser)));
    }

    // ✅ 2. BACKGROUND VERIFY
    axios
      .get(`${serverUrl}/api/user/current-user`, {
        withCredentials: true,
      })
      .then((res) => {
        dispatch(setUserData(res.data));
      })
      .catch(() => {
        // silent fail (session expired)
      })
      .finally(() => {
        dispatch(setAuthChecked(true));
      });
  }, [dispatch]);
};

export default useGetCurrentUser;
