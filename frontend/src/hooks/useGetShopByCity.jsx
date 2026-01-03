import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setShopsInMyCity } from "../redux/userSlice";
import { serverUrl } from "../App";

function useGetShopByCity() {
  const dispatch = useDispatch();
  const { currentCity } = useSelector(state => state.user);

  useEffect(() => {
    if (!currentCity) return;

    const fetchShops = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/shop/get-by-city/${currentCity}`
          // ❌ NO withCredentials
        );
        dispatch(setShopsInMyCity(res.data));
      } catch (error) {
        console.error("Shop load failed:", error);
        dispatch(setShopsInMyCity([]));
      }
    };

    fetchShops();
  }, [currentCity]);
}

export default useGetShopByCity;
