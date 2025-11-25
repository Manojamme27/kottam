import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";
import { addNotification } from "../redux/ownerSlice";
import { serverUrl } from "../App";

let socket = null;

export default function useOwnerSocket() {
    const dispatch = useDispatch();
    const { userData } = useSelector(state => state.user);

    useEffect(() => {
        if (!userData?._id || userData?.role !== "owner") return;

        // Connect socket only once
        if (!socket) {
            socket = io(serverUrl, {
                withCredentials: true
            });
        }

        // Send ownerId to backend
        socket.emit("registerOwner", userData._id);

        // Receive new order notification
        socket.on("newOrder", (order) => {
            dispatch(addNotification({
                title: "New Order Received",
                orderId: order._id,
                shopName: order.shopOrders.shop.name,
                amount: order.shopOrders.subtotal,
                time: new Date().toISOString(),
                read: false
            }));
        });

        return () => {
            if (socket) socket.off("newOrder");
        }

    }, [userData]);
}
