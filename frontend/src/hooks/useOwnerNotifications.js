import { useEffect } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { addNotification } from "../redux/ownerSlice";
import { setMyOrders } from "../redux/userSlice";
import { serverUrl } from "../App";
import axios from "axios";

let socket = null;

export default function useOwnerNotifications() {
    const dispatch = useDispatch();
    const { userData } = useSelector((state) => state.user);

    // 🔊 Preload notification sound
    const playSound = () => {
        const audio = new Audio("/notify.mp3");  // put file in public/ folder
        audio.play().catch(() => { });
    };

    // 🔥 Fetch updated orders
    const refreshOrders = async () => {
        try {
            const res = await axios.get(`${serverUrl}/api/order/my-orders`, {
                withCredentials: true,
            });
            dispatch(setMyOrders(res.data));
        } catch (err) { }
    };

    useEffect(() => {
        if (!userData || userData.role !== "owner") return;

        // Prevent duplicate socket connections
        if (!socket) {
            socket = io(serverUrl, {
                withCredentials: true,
                transports: ["websocket"],
            });
        }

        // 🟢 NEW ORDER
        socket.on("newOrder", (order) => {
            playSound();

            dispatch(
                addNotification({
                    title: "New Order Received",
                    message: `You received a new order from ${order.user.fullName}`,
                    timestamp: Date.now(),
                })
            );

            refreshOrders();
        });

        // 🟢 ORDER STATUS UPDATED (preparing, delivered, cancelled…)
        socket.on("update-status", () => {
            refreshOrders();
        });

        return () => {
            if (socket) {
                socket.off("newOrder");
                socket.off("update-status");
            }
        };
    }, [userData]);
}
