import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

function useGetMyOrders() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    // 🔒 HARD GATE — DO NOT FETCH UNTIL USER IS CONFIRMED
    if (!userData || !userData._id) return;

    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/order/my-orders`,
          { withCredentials: true }
        );

        dispatch(setMyOrders(res.data));
      } catch (error) {
        // ✅ 401 is NORMAL during startup — ignore completely
        if (error.response?.status === 401) return;

        console.error("getMyOrders failed:", error);
      }
    };

    fetchOrders();
  }, [userData?._id, dispatch]);
}

export default useGetMyOrders;
