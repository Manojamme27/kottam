import { useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setItemsInMyCity } from "../redux/userSlice";
import { serverUrl } from "../App";

function useGetItemsByCity() {
  const dispatch = useDispatch();
  const { currentCity } = useSelector(state => state.user);

  useEffect(() => {
    if (!currentCity) return;

    const fetchItems = async () => {
      try {
        const res = await axios.get(
          `${serverUrl}/api/item/get-by-city/${currentCity}`
          // ❌ NO withCredentials
        );
        dispatch(setItemsInMyCity(res.data));
      } catch (error) {
        console.error("Item load failed:", error);
        dispatch(setItemsInMyCity([]));
      }
    };

    fetchItems();
  }, [currentCity]);
}

export default useGetItemsByCity;
