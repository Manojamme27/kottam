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

  // ✅ Handle cancel order
  const handleCancelOrder = async () => {
    try {
      const res = await axios.put(
        `${serverUrl}/api/order/cancel/${cancelPopup.orderId}`,
        {},
        { withCredentials: true }
      );

      if (res.status === 200) {
        toast.success("Order cancelled successfully ✅", {
          position: "top-center",
          autoClose: 2000,
        });
        setCancelPopup({ show: false, orderId: null });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to cancel order ❌",
        {
          position: "top-center",
          autoClose: 2000,
        }
      );
    }
  };

  // ✅ Socket events
  useEffect(() => {
    socket?.on("newOrder", (data) => {
      if (data.shopOrders?.owner._id == userData._id) {
        dispatch(setMyOrders([data, ...myOrders]));
      }
    });

    socket?.on("update-status", ({ orderId, shopId, status, userId }) => {
      if (userId == userData._id) {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }));
      }
    });

    return () => {
      socket?.off("newOrder");
      socket?.off("update-status");
    };
  }, [socket, userData, myOrders, dispatch]);

  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex justify-center px-4">
      <div className="w-full max-w-[800px] p-4">
        <div className="flex items-center gap-5 mb-6">
          <div className="z-10 cursor-pointer" onClick={() => navigate("/")}>
            <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
          </div>
          <h1 className="text-2xl font-bold text-start">My Orders</h1>
        </div>

        <div className="space-y-6">
          {myOrders?.map((order, index) =>
            userData.role === "user" ? (
              <div
                key={index}
                className="relative border border-gray-200 rounded-xl shadow-sm p-4 bg-white hover:shadow-md transition"
              >
                <UserOrderCard data={order} />

                {/* ✅ Cancel button for users */}
                {order.shopOrders?.some(
                  (so) =>
                    so.status !== "delivered" &&
                    so.status !== "cancelled" &&
                    so.status !== "out of delivery"
                ) && (
                    <button
                      className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg shadow-sm transition-all"
                      onClick={() =>
                        setCancelPopup({ show: true, orderId: order._id })
                      }
                    >
                      Cancel Order
                    </button>
                  )}
              </div>
            ) : userData.role === "owner" ? (
              <OwnerOrderCard data={order} key={index} />
            ) : null
          )}
        </div>
      </div>

      {/* ✅ Cancel confirmation popup */}
      {cancelPopup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-10000">
          <div className="bg-white p-6 rounded-xl shadow-2xl w-[90%] max-w-sm text-center animate-fadeIn">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Cancel Order?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this order? This action cannot be
              undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCancelOrder}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
              >
                Confirm Cancel
              </button>
              <button
                onClick={() => setCancelPopup({ show: false, orderId: null })}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
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
