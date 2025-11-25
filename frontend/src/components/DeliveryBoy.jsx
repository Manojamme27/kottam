import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { serverUrl } from "../App";
import Nav from "./Nav";
import DeliveryBoyTracking from "./DeliveryBoyTracking";
import { ClipLoader } from "react-spinners";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FiMapPin,
  FiPackage,
  FiClock,
  FiShoppingBag,
  FiUser,
  FiDollarSign,
} from "react-icons/fi";

const calculateDeliveryFee = (amount) => {
  if (amount < 100) return 0;
  if (amount >= 100 && amount <= 199) return 30;
  if (amount >= 200 && amount <= 499) return 40;
  if (amount >= 500) return 50;
  return 0;
};

const getCodAmount = (order, shopOrder) => {
  const subtotal = Number(shopOrder?.subtotal || 0);
  const fee = calculateDeliveryFee(subtotal);

  if (order.paymentMethod === "cod") return subtotal + fee;
  if (order.payment === true) return 0;
  return subtotal + fee;
};

function DeliveryBoy() {
  const { userData, socket } = useSelector((state) => state.user);

  const [currentOrder, setCurrentOrder] = useState(null);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState(null);
  const [loading, setLoading] = useState(false);

  const ratePerDelivery = 50;
  const totalEarning = todayDeliveries.reduce(
    (sum, d) => sum + d.count * ratePerDelivery,
    0
  );

  // ------------------- GEO TRACKING -------------------
  useEffect(() => {
    if (!socket || userData?.role !== "deliveryBoy") return;

    let watchId;

    const handleSuccess = (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      const newLoc = { lat: latitude, lon: longitude };
      setDeliveryBoyLocation(newLoc);

      socket.emit("updateLocation", {
        latitude,
        longitude,
        userId: userData._id,
      });
    };

    navigator.geolocation.getCurrentPosition(handleSuccess);
    watchId = navigator.geolocation.watchPosition(handleSuccess);

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, userData]);

  // ------------------- FETCH FUNCTIONS -------------------
  const getAssignments = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-assignments`, {
        withCredentials: true,
      });
      setAvailableAssignments(result.data || []);
    } catch (error) {}
  };

  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-current-order`,
        {
          withCredentials: true,
        }
      );
      setCurrentOrder(result.data || null);
    } catch (error) {
      setCurrentOrder(null);
    }
  };

  const handleTodayDeliveries = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-today-deliveries`,
        {
          withCredentials: true,
        }
      );
      setTodayDeliveries(result.data || []);
    } catch (error) {}
  };

  const acceptOrder = async (assignmentId) => {
    try {
      await axios.get(`${serverUrl}/api/order/accept-order/${assignmentId}`, {
        withCredentials: true,
      });

      await getCurrentOrder();
      await handleTodayDeliveries();
      await getAssignments();
    } catch (error) {}
  };

  // 🚀 NEW → DIRECT DELIVERY WITHOUT OTP
  const markAsDelivered = async () => {
    if (!currentOrder) return;

    setLoading(true);
    try {
      await axios.post(
        `${serverUrl}/api/order/update-status/${currentOrder._id}/${currentOrder.shopOrder.shop._id}`,
        { status: "delivered" },
        { withCredentials: true }
      );

      // refresh
      await getAssignments();
      await handleTodayDeliveries();
      setCurrentOrder(null);
      alert("✅ Delivery Completed!");

    } catch (error) {
      console.log(error);
      alert("Error marking delivered");
    }
    setLoading(false);
  };

  // ------------------- SOCKET LISTENER -------------------
  useEffect(() => {
    if (!socket || !userData?._id) return;

    const listener = (data) => {
      if (String(data.sentTo) === String(userData._id)) {
        setAvailableAssignments((prev) => [...prev, data]);
      }
    };

    socket.on("newAssignment", listener);
    return () => socket.off("newAssignment", listener);
  }, [socket, userData]);

  // ------------------- INITIAL LOAD -------------------
  useEffect(() => {
    if (userData) {
      getAssignments();
      getCurrentOrder();
      handleTodayDeliveries();
    }
  }, [userData]);

  const codAmountForCurrent =
    currentOrder && getCodAmount(currentOrder, currentOrder.shopOrder);

  return (
    <div className="w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto pb-10">
      <Nav />

      <div className="w-full max-w-[980px] flex flex-col gap-6 items-center mt-4">

        {/* ------------------- CURRENT ORDER ------------------- */}
        {currentOrder && (
          <div className="bg-white rounded-2xl p-5 shadow-md w-[92%] border border-orange-100 flex flex-col gap-4">

            <h2 className="text-lg font-bold flex items-center gap-2">
              <FiPackage className="text-[#ff4d2d]" /> Current Order
            </h2>

            <div className="border p-4 rounded-xl bg-orange-50/40">
              <p className="font-semibold text-gray-900">
                {currentOrder?.shopOrder?.shop?.name}
              </p>

              <p className="text-xs text-gray-600 mt-2">
                Customer: {currentOrder?.user?.fullName}
              </p>

              <p className="text-xs text-gray-600 mt-2">
                Address: {currentOrder.deliveryAddress.text}
              </p>
            </div>

            {/* MAP */}
            <DeliveryBoyTracking
              data={{
                deliveryBoyLocation,
                customerLocation: {
                  lat: currentOrder.deliveryAddress.latitude,
                  lon: currentOrder.deliveryAddress.longitude,
                },
              }}
            />

            {/* 🚀 MARK AS DELIVERED BUTTON */}
            <button
              onClick={markAsDelivered}
              disabled={loading}
              className="bg-green-500 text-white px-5 py-3 rounded-lg font-bold shadow-md hover:bg-green-600"
            >
              {loading ? <ClipLoader size={20} color="white" /> : "Mark as Delivered"}
            </button>

          </div>
        )}

        {/* ------------------- AVAILABLE ORDERS ------------------- */}
        {!currentOrder && (
          <div className="bg-white rounded-2xl p-5 shadow-md w-[92%] border border-orange-100">
            <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiPackage className="text-[#ff4d2d]" />
              Available Orders
            </h1>

            {availableAssignments.length === 0 ? (
              <p className="text-gray-500 text-sm">No orders available right now.</p>
            ) : (
              availableAssignments.map((a, index) => (
                <div
                  key={index}
                  className="border p-4 rounded-lg mb-3 bg-orange-50/40"
                >
                  <p className="font-bold">{a.shopName}</p>
                  <p className="text-xs text-gray-600">{a.deliveryAddress.text}</p>

                  <button
                    className="mt-2 bg-[#ff4d2d] text-white px-4 py-2 rounded-lg"
                    onClick={() => acceptOrder(a.assignmentId)}
                  >
                    Accept
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryBoy;
