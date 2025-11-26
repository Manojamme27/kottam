import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import UserOrderCard from "../components/UserOrderCard";
import OwnerOrderCard from "../components/OwnerOrderCard";
import {
  setMyOrders,
  updateRealtimeOrderStatus,
} from "../redux/userSlice.js";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";

function MyOrders() {
  const { userData, myOrders, socket } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [cancelPopup, setCancelPopup] = useState({
    show: false,
    orderId: null,
  });

  // ============================================
  // ALWAYS normalize to array
  // ============================================
  const normalizeShopOrders = (shopOrders) => {
    if (!shopOrders) return [];
    return Array.isArray(shopOrders) ? shopOrders : [shopOrders];
  };

  // ================================
  // CANCEL ORDER
  // ================================
  const handleCancelOrder = async () => {
    try {
      const res = await axios.put(
        `${serverUrl}/api/order/cancel/${cancelPopup.orderId}`,
        {},
        { withCredentials: true }
      );

      if (res.status === 200) {
        toast.success("Order cancelled successfully!", {
          position: "top-center",
        });

        setCancelPopup({ show: false, orderId: null });

        dispatch(
  setMyOrders(
    myOrders.map((o) => {
      if (o._id !== cancelPopup.orderId) return o;

      const normalized = Array.isArray(o.shopOrders)
        ? o.shopOrders
        : [o.shopOrders];

      return {
        ...o,
        shopOrders: normalized.map((so) => ({
          ...so,
          status: "cancelled",
        })),
      };
    })
  )
);

      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel order ❌");
    }
  };

  // ================================
  // REALTIME SOCKET HANDLING
  // ================================
  useEffect(() => {
    if (!socket) return;

    // OWNER SIDE → Receive NEW user orders
    const handleNewOrder = (order) => {
      if (userData.role === "owner") {
        dispatch(
          setMyOrders([
            {
              ...order,
              shopOrders: normalizeShopOrders(order.shopOrders),
            },
            ...myOrders,
          ])
        );
      }
    };

    // USER SIDE → Receive status update
    const handleStatusUpdate = ({ orderId, shopId, status, userId }) => {
      if (String(userId) === String(userData._id)) {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }));
      }
    };

    socket.on("newOrder", handleNewOrder);
    socket.on("update-status", handleStatusUpdate);

    return () => {
      socket.off("newOrder", handleNewOrder);
      socket.off("update-status", handleStatusUpdate);
    };
  }, [socket, userData, dispatch]); // 🚀 REMOVE myOrders to prevent infinite loops!

  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex justify-center px-4">
      <div className="w-full max-w-[800px] p-4">
        {/* Header */}
        <div className="flex items-center gap-5 mb-6">
          <div className="cursor-pointer" onClick={() => navigate("/")}>
            <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
          </div>
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>

        {/* ORDERS */}
        <div className="space-y-6">
          {myOrders?.map((order) => {
            const normalized = normalizeShopOrders(order.shopOrders);

            return userData.role === "user" ? (
              <div
                key={order._id}
                className="relative border border-gray-200 rounded-xl shadow-sm p-4 bg-white hover:shadow-md transition"
              >
                <UserOrderCard data={order} />

                {/* CANCEL BUTTON */}
                {normalized.some(
                  (so) =>
                    so?.status !== "delivered" &&
                    so?.status !== "cancelled" &&
                    so?.status !== "out of delivery"
                ) && (
                  <button
                    className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm transition"
                    onClick={() =>
                      setCancelPopup({ show: true, orderId: order._id })
                    }
                  >
                    Cancel
                  </button>
                )}
              </div>
            ) : userData.role === "owner" ? (
              <OwnerOrderCard data={order} key={order._id} />
            ) : null;
          })}
        </div>
      </div>

      {/* CANCEL POPUP */}
      {cancelPopup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-[2000]">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-[90%] max-w-sm text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Cancel Order?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this order?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleCancelOrder}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Confirm Cancel
              </button>

              <button
                onClick={() =>
                  setCancelPopup({ show: false, orderId: null })
                }
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;

