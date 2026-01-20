import { useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetMyOrders = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // ✅ hydrate instantly
    const cached = localStorage.getItem("myOrders");
    if (cached) {
      dispatch(setMyOrders(JSON.parse(cached)));
    }

    // ✅ background sync
    axios
      .get(`${serverUrl}/api/order/my-orders`, {
        withCredentials: true,
      })
      .then((res) => {
        dispatch(setMyOrders(res.data));
      })
      .catch(() => {});
  }, [dispatch]);
};

export default useGetMyOrders;
