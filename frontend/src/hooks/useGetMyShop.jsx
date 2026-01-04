import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";

const useGetMyshop = () => {
  const dispatch = useDispatch();
  const { userData, authChecked } = useSelector(state => state.user);

  useEffect(() => {
    // 🛑 HARD GUARDS
    if (!authChecked) return;
    if (!userData?._id) return;
    if (userData.role !== "owner") return;

    const fetchShop = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/shop/get-my`,
          { withCredentials: true }
        );
        dispatch(setMyShopData(res.data));
      } catch (err) {
        // ❌ 401 is NORMAL → ignore
        if (err.response?.status !== 401) {
          console.error("get-my shop error:", err);
        }
      }
    };

    fetchShop();
  }, [authChecked, userData?._id, userData?.role, dispatch]);
};

export default useGetMyshop;
