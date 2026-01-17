import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";

const useGetMyOrders = () => {
  const dispatch = useDispatch();
  const { userData, authChecked } = useSelector(state => state.user);

  useEffect(() => {
    if (!authChecked || !userData?._id) return;

    axios
      .get(`${serverUrl}/api/order/my-orders`, {
        withCredentials: true,
      })
      .then(res => {
        dispatch(setMyOrders(res.data || [])); // 🔥 DB IS TRUTH
      })
      .catch(() => {
        dispatch(setMyOrders([]));
      });
  }, [authChecked, userData?._id, dispatch]);
};

export default useGetMyOrders;
