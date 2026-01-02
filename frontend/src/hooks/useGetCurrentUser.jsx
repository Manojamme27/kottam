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
        {
          withCredentials: true,
          // ✅ DO NOT retry endlessly if token missing
          validateStatus: (status) => status < 500,
        }
      );

      if (res.status === 200 && res.data?._id) {
        dispatch(setUserData(res.data));
      } else {
        dispatch(setUserData(null));
      }
    } catch {
      dispatch(setUserData(null));
    }
  };

  fetchUser();
}, [dispatch]);

};

export default useGetCurrentUser;

