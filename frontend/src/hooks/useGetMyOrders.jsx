import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

function useGetMyOrders() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    // ✅ Fetch for BOTH user & owner
    if (!userData?._id) return;

    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/order/my-orders`,
          { withCredentials: true }
        );

        dispatch(setMyOrders(res.data));
      } catch (error) {
        console.log("🔥 ERROR RESPONSE (ORDERS):", error.response?.data);
        console.log("🔥 FULL ERROR (ORDERS):", error);
      }
    };

    fetchOrders();
  }, [userData?._id, dispatch]);
}

export default useGetMyOrders;
