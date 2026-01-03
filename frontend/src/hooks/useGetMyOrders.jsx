import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

function useGetMyOrders() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData?._id) return;

    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/order/my-orders`,
          { withCredentials: true }
        );

        dispatch(setMyOrders(res.data));
      } catch (error) {
        if (error.response?.status === 401) {
          // ✅ NORMAL → ignore silently
          return;
        }

        console.error("getMyOrders failed:", error);
      }
    };

    fetchOrders();
  }, [userData?._id, dispatch]);
}

export default useGetMyOrders;
