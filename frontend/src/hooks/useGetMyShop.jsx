import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";

function useGetMyshop() {
  const dispatch = useDispatch();
  const { userData, authChecked } = useSelector(state => state.user);

  useEffect(() => {
    // ⛔ wait until auth check completes
    if (!authChecked) return;

    // ⛔ only owners have a shop
    if (!userData?._id || userData.role !== "owner") return;

    const fetchShop = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/shop/get-my`,
          { withCredentials: true }
        );
        dispatch(setMyShopData(res.data));
      } catch (error) {
        console.error("Failed to fetch shop:", error);
      }
    };

    fetchShop();
  }, [authChecked, userData?._id, userData?.role, dispatch]);
}

export default useGetMyshop;
