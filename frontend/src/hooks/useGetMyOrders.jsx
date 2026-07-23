import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetMyOrders = () => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    // Hydrate cached orders
    const cached = localStorage.getItem("myOrders");
    if (cached) {
      dispatch(setMyOrders(JSON.parse(cached)));
    }

    // Don't fetch if no user is logged in
    if (!userData?._id) return;

    axios
      .get(`${serverUrl}/api/order/my-orders`, {
        withCredentials: true,
      })
      .then((res) => {
        dispatch(setMyOrders(res.data));
      })
      .catch((err) => {
        if (err.response?.status !== 401) {
          console.error(err);
        }
      });
  }, [dispatch, userData]);
};

export default useGetMyOrders;