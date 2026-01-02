import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setMyOrders } from '../redux/userSlice.js'

function useGetMyOrders() {
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.user)

  useEffect(() => {

    // ⛔ Wait until user is logged in
    if (!userData?._id || userData.role !== "owner") return;


    const fetchOrders = async () => {
      try {
        const result = await axios.get(
          `${serverUrl}/api/order/my-orders`,
          { withCredentials: true }
        )

        dispatch(setMyOrders(result.data))

      } catch (error) {
        console.log("🔥 ERROR RESPONSE (ORDERS):", error.response?.data)
        console.log("🔥 FULL ERROR (ORDERS):", error)
      }
    }

    fetchOrders()

  }, [userData?._id])  // run only after login
}

export default useGetMyOrders

