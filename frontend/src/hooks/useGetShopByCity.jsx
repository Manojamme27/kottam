import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setShopsInMyCity } from '../redux/userSlice.js'

function useGetShopByCity() {
  const dispatch = useDispatch()
  const { currentCity, userData } = useSelector(state => state.user)

  useEffect(() => {


    if (!currentCity) return;     // wait until city loaded

    const fetchShops = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/shop/get-by-city/${currentCity}`,
          { withCredentials: true }
        )
        dispatch(setShopsInMyCity(result.data))
        console.log(result.data)
      } catch (error) {
        console.log("🔥 ERROR RESPONSE (SHOPS):", error.response?.data);
        console.log("🔥 FULL ERROR (SHOPS):", error);
      }
    }

    fetchShops()

  }, [currentCity, userData])
}

export default useGetShopByCity

