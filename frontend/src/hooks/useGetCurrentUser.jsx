import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice.js'

function useGetCurrentUser() {
  const dispatch = useDispatch()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/user/current`, { withCredentials: true })
        dispatch(setUserData(result.data))
      } catch (error) {
        // ❗ Do NOT show "token not found"
        if (error.response?.data?.message !== "token not found") {
          console.log("Current user error:", error)
        }
        // silently ignore (user is simply not logged in)
      }
    }

    fetchUser()
  }, [])
}

export default useGetCurrentUser
