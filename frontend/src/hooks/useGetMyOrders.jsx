import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetMyOrders = () => {
  const dispatch = useDispatch();
  const { userData, authChecked } = useSelector(state => state.user);

  useEffect(() => {
    if (!authChecked) return;
    if (!userData?._id) return;

    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/order/my-orders`,
          { withCredentials: true }
        );

        dispatch(setMyOrders(res.data));
      } catch (error) {
        // ✅ CRITICAL FIX
        if (error.response?.status === 401) {
          console.warn("⚠️ Orders fetch skipped (unauthorized, using cache)");
          return; // 👈 DO NOTHING
        }

        console.error("fetch orders failed:", error);
      }
    };

    fetchOrders();
  }, [authChecked, userData?._id, dispatch]);
};

export default useGetMyOrders;
