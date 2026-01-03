import axios from "axios";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

function useGetMyOrders() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const retried = useRef(false); // ✅ KEY

  useEffect(() => {
    if (!userData || !userData._id) return;

    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/order/my-orders`,
          { withCredentials: true }
        );

        dispatch(setMyOrders(res.data));
      } catch (error) {
        if (error.response?.status === 401 && !retried.current) {
          // ✅ RETRY ONCE after auth settles
          retried.current = true;
          setTimeout(fetchOrders, 500);
          return;
        }

        console.error("getMyOrders failed:", error);
      }
    };

    fetchOrders();
  }, [userData, dispatch]);
}

export default useGetMyOrders;
