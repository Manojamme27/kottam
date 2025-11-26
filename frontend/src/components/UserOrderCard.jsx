import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { updateRealtimeOrderStatus } from "../redux/userSlice.js";
import { toast } from "react-toastify";

function UserOrderCard({ data }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { socket } = useSelector((state) => state.user);

    const [selectedRating, setSelectedRating] = useState({});
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelPopup, setShowCancelPopup] = useState(false);

    // ⭐⭐⭐ REALTIME STATUS UPDATE — FIX ⭐⭐⭐
    useEffect(() => {
        if (!socket) return;

        const handler = ({ orderId, shopId, status, userId }) => {
            if (orderId === data._id) {
                dispatch(
                    updateRealtimeOrderStatus({
                        orderId,
                        shopId,
                        status,
                    })
                );
            }
        };

        socket.on("update-status", handler);

        return () => {
            socket.off("update-status", handler);
        };
    }, [socket, data._id, dispatch]);
    // ⭐⭐⭐ END FIX ⭐⭐⭐

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const handleRating = async (itemId, rating) => {
        try {
            await axios.post(
                `${serverUrl}/api/item/rating`,
                { itemId, rating },
                { withCredentials: true }
            );
            setSelectedRating((prev) => ({
                ...prev,
                [itemId]: rating,
            }));
        } catch (error) {
            console.error("❌ Rating submission failed:", error);
        }
    };

    const confirmCancelOrder = async () => {
        setIsCancelling(true);
        try {
            const res = await axios.put(
                `${serverUrl}/api/order/cancel/${data._id}`,
                {},
                { withCredentials: true }
            );

            data?.shopOrders?.forEach((shopOrder) => {
                dispatch(
                    updateRealtimeOrderStatus({
                        orderId: data._id,
                        shopId: shopOrder?.shop?._id,
                        status: "cancelled",
                    })
                );
            });

            setShowCancelPopup(false);

            toast.success("Order cancelled successfully", {
                position: "top-center",
                autoClose: 1500,
                theme: "colored",
            });
        } catch (error) {
            console.error("❌ Cancel failed:", error);
            toast.error("Failed to cancel order. Please try again.", {
                position: "top-center",
                autoClose: 2000,
                theme: "colored",
            });
        } finally {
            setIsCancelling(false);
        }
    };

    const shopOrders = Array.isArray(data?.shopOrders)
        ? data.shopOrders
        : data?.shopOrders
            ? [data.shopOrders]
            : [];

    return (
        <>
            <div
                className={`bg-white rounded-lg shadow p-4 space-y-4 ${
                    shopOrders?.[0]?.status === "cancelled" ? "opacity-60" : ""
                }`}
            >
                {/* Header */}
                <div className="flex justify-between border-b pb-2">
                    <div>
                        <p className="font-semibold">
                            Order #{data?._id ? data._id.slice(-6) : "N/A"}
                        </p>
                        <p className="text-sm text-gray-500">
                            Date: {formatDate(data?.createdAt)}
                        </p>
                    </div>
                    <div className="text-right">
                        {data?.paymentMethod === "cod" ? (
                            <p className="text-sm text-gray-500">
                                {data.paymentMethod?.toUpperCase()}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 font-semibold">
                                Payment: {data?.payment ? "true" : "false"}
                            </p>
                        )}
                        <p
                            className={`font-medium ${
                                shopOrders?.[0]?.status === "cancelled"
                                    ? "text-gray-400"
                                    : "text-blue-600"
                            }`}
                        >
                            {shopOrders?.[0]?.status || "Pending"}
                        </p>
                    </div>
                </div>

                {/* Items */}
                {shopOrders.map((shopOrder, index) => (
                    <div
                        className="border rounded-lg p-3 bg-[#fffaf7] space-y-3"
                        key={index}
                    >
                        <p className="font-medium">
                            {shopOrder?.shop?.name || "Shop Name Unavailable"}
                        </p>

                        <div className="mt-2">
                            {shopOrder?.shopOrderItems?.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-4 text-sm font-semibold text-slate-700 border-b pb-1">
                                        <span>Item</span>
                                        <span className="text-center">Qty</span>
                                        <span className="text-center">Price</span>
                                        <span className="text-right">Total</span>
                                    </div>

                                    {shopOrder.shopOrderItems.map((item, idx) => {
                                        const qty = item?.quantity || 0;
                                        const price = item?.price || 0;
                                        const lineTotal = qty * price;

                                        return (
                                            <div
                                                key={idx}
                                                className="grid grid-cols-4 text-sm py-1.5 border-b last:border-b-0"
                                            >
                                                <span className="truncate">
                                                    {item?.name || "Unnamed"}
                                                </span>
                                                <span className="text-center">{qty}</span>
                                                <span className="text-center">
                                                    ₹{price}
                                                </span>
                                                <span className="text-right font-medium">
                                                    ₹{lineTotal}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    No items found
                                </p>
                            )}
                        </div>

                        <div className="flex justify-between items-center border-t pt-2">
                            <p className="font-semibold">
                                Subtotal: ₹{shopOrder?.subtotal || 0}
                            </p>
                            <span
                                className={`text-sm font-medium ${
                                    shopOrder?.status === "cancelled"
                                        ? "text-gray-400"
                                        : "text-blue-600"
                                }`}
                            >
                                {shopOrder?.status || "Pending"}
                            </span>
                        </div>
                    </div>
                ))}

                {/* Footer */}
                <div className="flex justify-between items-center border-t pt-2">
                    <p className="font-semibold">
                        Total: ₹{data?.totalAmount || 0}
                    </p>

                    <div className="flex gap-2">
                        {!["cancelled", "delivered", "out of delivery"].includes(
                            shopOrders?.[0]?.status?.toLowerCase()?.trim()
                        ) && (
                            <button
                                onClick={() => setShowCancelPopup(true)}
                                className="bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ease-in-out"
                            >
                                Cancel Order
                            </button>
                        )}
                        <button
                            className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 active:scale-95"
                            onClick={() =>
                                navigate(`/track-order/${data?._id}`)
                            }
                        >
                            Track Order
                        </button>
                    </div>
                </div>
            </div>

            {/* Cancel Popup */}
            {showCancelPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-10000">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-[90%] max-w-sm text-center scale-100 animate-fadeIn">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Confirm Cancellation
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to cancel this order?
                        </p>

                        <div className="flex justify-center gap-3">
                            <button
                                onClick={confirmCancelOrder}
                                disabled={isCancelling}
                                className={`px-4 py-2 rounded-lg font-medium text-white transition-all duration-300 ${
                                    isCancelling
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transform hover:scale-105 active:scale-95 shadow-md"
                                }`}
                            >
                                {isCancelling ? "Cancelling..." : "Confirm"}
                            </button>

                            <button
                                onClick={() => setShowCancelPopup(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 active:scale-95"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default UserOrderCard;
