import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setCurrentAddress, setCurrentCity, setCurrentState, setUserData } from '../redux/userSlice'
import { setAddress, setLocation } from '../redux/mapSlice'

function useUpdateLocation() {
    const dispatch = useDispatch()
    const { userData } = useSelector(state => state.user)

    useEffect(() => {
        if (!userData) return;  // ❗ Do NOT update location if user is NOT logged in

        const updateLocation = async (lat, lon) => {
            try {
                const result = await axios.post(
                    `${serverUrl}/api/user/update-location`,
                    { lat, lon },
                    { withCredentials: true }
                )
                console.log(result.data)

            } catch (error) {
                // ❗ Ignore "token not found"
                if (error.response?.data?.message !== "token not found") {
                    console.log("Update location error:", error)
                }
            }
        }

        const watcher = navigator.geolocation.watchPosition((pos) => {
            updateLocation(pos.coords.latitude, pos.coords.longitude)
        })

        // ❗ Cleanup watcher when component unmounts
        return () => navigator.geolocation.clearWatch(watcher);

    }, [userData])
}

export default useUpdateLocation
