import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetCurrentUser = () => {
  const dispatch = useDispatch();

  useEffect(() => {
  const savedUser = localStorage.getItem("userData");
  if (!savedUser) return; // ✅ CRITICAL FIX

  const fetchUser = async () => {
    try {
      const res = await axios.get(
        `${serverUrl}/api/user/current`,
        { withCredentials: true }
      );
      dispatch(setUserData(res.data));
dispatch({ type: "user/authCheckedDone" });

    } catch (error) {
      
      // ✅ 401 is NORMAL → do nothing
      return;
    }
  };

  fetchUser();
}, [dispatch]);


};

export default useGetCurrentUser;





