import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetMyOrders = () => {
  const dispatch = useDispatch();
  const { userData, authChecked } = useSelector(state => state.user);

  useEffect(() => {
    // ✅ wait until auth resolved
    if (!authChecked) return;

    // ✅ user not logged in → clear orders
    if (!userData?._id) {
      dispatch(setMyOrders([]));
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/order/my-orders`,
          { withCredentials: true }
        );

        dispatch(setMyOrders(res.data));
      } catch (error) {
        console.error("fetch orders failed:", error);
      }
    };

    fetchOrders();
  }, [authChecked, userData?._id, dispatch]);
};

export default useGetMyOrders;
