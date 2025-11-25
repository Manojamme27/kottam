import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setItemsInMyCity } from '../redux/userSlice.js'

function useGetItemsByCity() {
  const dispatch = useDispatch()
  const { currentCity, userData } = useSelector(state => state.user)

  useEffect(() => {

    // ⛔ STOP if user not logged in yet
    if (!userData?._id) return;

    // ⛔ STOP if city undefined or empty
    if (!currentCity) return;

    const fetchItems = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/item/get-by-city/${currentCity}`,
          { withCredentials: true }
        )

        dispatch(setItemsInMyCity(result.data))
        console.log("Items Loaded:", result.data)

      } catch (error) {
        console.log("🔥 ERROR RESPONSE:", error.response?.data)
        console.log("🔥 FULL ERROR:", error)
      }
    }

    fetchItems()

  }, [currentCity, userData]) // 🔥 depends on BOTH user load + city
}

export default useGetItemsByCity
