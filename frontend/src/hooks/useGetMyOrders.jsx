import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetMyOrders = () => {
  const dispatch = useDispatch();
  const { authChecked } = useSelector(state => state.user);

  useEffect(() => {
    if (!authChecked) return;

    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/order/my-orders`,
          { withCredentials: true }
        );
        dispatch(setMyOrders(res.data));
      } catch (error) {
        if (error.response?.status === 401) {
          // ✅ keep existing orders
          return;
        }
        console.error(error);
      }
    };

    fetchOrders();
  }, [authChecked, dispatch]);
};

export default useGetMyOrders;
