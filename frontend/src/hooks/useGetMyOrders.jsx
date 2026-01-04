import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

function useGetMyOrders() {
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);
if (!userData?._id) return;


  useEffect(() => {
    // ⛔ WAIT until auth is confirmed
    if (!authChecked) return;

    // ⛔ Not logged in
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
        if (error.response?.status === 401) {
          dispatch(setMyOrders([]));
          return;
        }

        console.error("getMyOrders failed:", error);
      }
    };

    fetchOrders();
  }, [authChecked, userData?._id, dispatch]);
}

export default useGetMyOrders;

