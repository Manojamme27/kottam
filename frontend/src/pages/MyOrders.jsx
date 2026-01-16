import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import UserOrderCard from "../components/UserOrderCard";
import OwnerOrderCard from "../components/OwnerOrderCard";
import { setMyOrders } from "../redux/userSlice.js";
import axios from "axios";
import { serverUrl } from "../App";
import { toast } from "react-toastify";

function MyOrders() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    userData,
    myOrders = [],
    authChecked,
  } = useSelector((state) => state.user);

  const [cancelPopup, setCancelPopup] = useState({
    show: false,
    orderId: null,
  });

  // 🔐 Redirect after auth check
  useEffect(() => {
    if (authChecked && !userData?._id) {
      navigate("/signin");
    }
  }, [authChecked, userData, navigate]);

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
    if (!userData?._id || !cancelPopup.orderId) return;

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
      toast.error(
        error.response?.data?.message || "Failed to cancel order ❌"
      );
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex justify-center px-4">
      <div className="w-full max-w-[800px] p-4">

        {/* LOADING STATE */}
        {!authChecked && (
          <div className="min-h-screen flex items-center justify-center text-gray-500">
            Loading orders...
          </div>
        )}

        {/* MAIN CONTENT */}
        {authChecked && (
          <>
            {/* HEADER */}
            <div className="flex items-center gap-5 mb-6">
              <div className="cursor-pointer" onClick={() => navigate("/")}>
                <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
              </div>
              <h1 className="text-2xl font-bold">My Orders</h1>
            </div>

            {/* EMPTY STATE */}
            {myOrders.length === 0 ? (
              <div className="flex justify-center mt-10 px-4">
                <div className="w-full max-w-md bg-white shadow-xl rounded-3xl p-8 border">
                  <h2 className="text-xl font-bold text-center mb-2">
                    No Orders Yet
                  </h2>
                  <p className="text-gray-500 text-center text-sm mb-6">
                    When you place an order, you can track it here.
                  </p>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold"
                  >
                    Start Shopping
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {myOrders.map((order) => {
                  const normalized = normalizeShopOrders(order.shopOrders);

                  return userData?.role === "user" ? (
                    <div
                      key={order._id}
                      className="relative border rounded-xl p-4 bg-white"
                    >
                      <UserOrderCard data={order} />

                      {normalized.some(
                        (so) =>
                          so.status !== "delivered" &&
                          so.status !== "cancelled" &&
                          so.status !== "out of delivery"
                      ) && (
                        <button
                          className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1.5 rounded-lg"
                          onClick={() =>
                            setCancelPopup({
                              show: true,
                              orderId: order._id,
                            })
                          }
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : userData?.role === "owner" ? (
                    <OwnerOrderCard key={order._id} data={order} />
                  ) : null;
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* CANCEL POPUP */}
      {cancelPopup.show && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">Cancel Order?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel this order?
            </p>

            <div className="flex justify-center gap-3">
              <button
                onClick={handleCancelOrder}
                className="bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Confirm Cancel
              </button>

              <button
                onClick={() =>
                  setCancelPopup({ show: false, orderId: null })
                }
                className="bg-gray-200 px-4 py-2 rounded-lg"
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
