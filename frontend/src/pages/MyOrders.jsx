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

  const role = userData?.role?.toLowerCase();

  // ✅ EARLY LOADING RETURN (FIXES WHITE SCREEN)
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading orders...
      </div>
    );
  }

  // 🔐 REDIRECT IF NOT LOGGED IN
  useEffect(() => {
    if (authChecked && !userData?._id) {
      navigate("/signin");
    }
  }, [authChecked, userData, navigate]);

  const [cancelPopup, setCancelPopup] = useState({
    show: false,
    orderId: null,
  });

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
        toast.success("Order cancelled successfully!");

        setCancelPopup({ show: false, orderId: null });

        dispatch(
          setMyOrders(
            myOrders.map((o) => {
              if (o._id !== cancelPopup.orderId) return o;

              return {
                ...o,
                shopOrders: normalizeShopOrders(o.shopOrders).map((so) => ({
                  ...so,
                  status: "cancelled",
                })),
              };
            })
          )
        );
      }
    } catch (error) {
      toast.error("Failed to cancel order ❌");
    }
  };

  // ============================================
  // SOCKET EVENTS
  // ============================================
  useEffect(() => {
    if (!socket || !userData?._id) return;

    const handleNewOrder = (order) => {
      if (role === "owner") {
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
  }, [socket, userData?._id, role, dispatch]); // ✅ FIXED deps

  const visibleOrders = myOrders;

  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex justify-center px-4">
      <div className="w-full max-w-[800px] p-4">

        {/* HEADER */}
        <div className="flex items-center gap-5 mb-6">
          <div className="cursor-pointer" onClick={() => navigate("/")}>
            <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
          </div>
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>

        {visibleOrders.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No Orders Yet
          </div>
        ) : (
          <div className="space-y-6">
            {visibleOrders.map((order) => {
              const normalized = normalizeShopOrders(order.shopOrders);

              return role === "user" ? (
                <div
                  key={order._id}
                  className="relative border rounded-xl p-4 bg-white"
                >
                  <UserOrderCard data={order} />

                  {normalized.some(
                    (so) =>
                      !["delivered", "cancelled", "out of delivery"].includes(
                        so?.status
                      )
                  ) && (
                    <button
                      className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded"
                      onClick={() =>
                        setCancelPopup({ show: true, orderId: order._id })
                      }
                    >
                      Cancel
                    </button>
                  )}
                </div>
              ) : role === "owner" ? (
                <OwnerOrderCard key={order._id} data={order} />
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* CANCEL POPUP */}
      {cancelPopup.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl text-center">
            <h3 className="font-semibold mb-2">Cancel Order?</h3>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleCancelOrder}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Confirm
              </button>
              <button
                onClick={() => setCancelPopup({ show: false, orderId: null })}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;
