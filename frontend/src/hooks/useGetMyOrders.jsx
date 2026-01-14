import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetMyOrders = () => {
  const dispatch = useDispatch();
  const { authChecked, userData, myOrders } = useSelector(
    state => state.user
  );

  useEffect(() => {
    if (!authChecked) return;
    if (!userData?._id) return;
    if (myOrders?.length) return; // ✅ PREVENT DOUBLE FETCH

    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/order/my-orders`,
          { withCredentials: true }
        );

        dispatch(setMyOrders(res.data));
      } catch (error) {
        // ✅ NEVER CRASH UI
        console.warn("Orders fetch skipped");
      }
    };

    fetchOrders();
  }, [authChecked, userData?._id, dispatch]);
};

export default useGetMyOrders;
