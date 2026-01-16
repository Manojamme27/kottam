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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    userData,
    myOrders = [],
    socket,
    authChecked,
  } = useSelector((state) => state.user);

  // ✅ FIX 1: EARLY RETURN (DO NOT RENDER JSX BEFORE AUTH CHECK)
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading orders...
      </div>
    );
  }

  // 🔐 AFTER auth check, redirect if not logged in
  useEffect(() => {
    if (authChecked && !userData?._id) {
      navigate("/signin");
    }
  }, [authChecked, userData, navigate]);

  // ✅ BLOCK UNAUTHENTICATED ACCESS
  const [cancelPopup, setCancelPopup] = useState({
    show: false,
    orderId: null,
  });

  // ============================================
  // NORMALIZE SHOP ORDER FORMAT
  // ============================================
  const normalizeShopOrders = (shopOrders) => {
    if (!shopOrders) return [];
    return Array.isArray(shopOrders) ? shopOrders : [shopOrders];
  };

  // ============================================
  // CANCEL ORDER
  // ============================================
  const handleCancelOrder = async () => {
    if (!userData?._id) return;

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

  // ============================================
  // SOCKET: NEW ORDER + STATUS UPDATE
  // ============================================
  useEffect(() => {
    if (!socket || !userData?._id) return;

    const handleNewOrder = (order) => {
      if (userData.role === "owner") {
        dispatch(
          setMyOrders((prev) => [
            {
              ...order,
              shopOrders: normalizeShopOrders(order.shopOrders),
            },
            ...prev,
          ])
        );
      }
    };

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
  }, [socket, userData?._id, dispatch]);

  const visibleOrders = myOrders;

  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex justify-center px-4">
      <div className="w-full max-w-[800px] p-4">
        {/* ✅ FIX 2: PROPERLY CLOSED FRAGMENT */}
        <>
          {/* HEADER */}
          <div className="flex items-center gap-5 mb-6">
            <div className="cursor-pointer" onClick={() => navigate("/")}>
              <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
            </div>
            <h1 className="text-2xl font-bold">My Orders</h1>
          </div>

          {visibleOrders.length === 0 ? (
            <div className="flex justify-center mt-10 px-4 animate-fadeIn">
              <div className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-xl rounded-3xl p-8 border border-green-100 animate-slideUp">
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  No Orders Yet
                </h2>
                <p className="text-gray-500 text-center text-sm mb-7">
                  When you place an order, you can track it here.
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="w-full py-3.5 bg-linear-to-r from-green-500 to-green-600 
                  text-white font-semibold text-lg rounded-xl shadow-md hover:shadow-lg"
                >
                  Start Shopping
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {visibleOrders.map((order) =>
                userData.role === "user" ? (
                  <UserOrderCard key={order._id} data={order} />
                ) : (
                  <OwnerOrderCard key={order._id} data={order} />
                )
              )}
            </div>
          )}
        </>
      </div>

      {cancelPopup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-2000">
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
