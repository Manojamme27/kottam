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
} from "react-icons/fi";

// ✅ SAME DELIVERY FEE SLAB AS CHECKOUT / OWNER
const calculateDeliveryFee = (amount) => {
  if (amount < 100) return 0;
  if (amount >= 100 && amount <= 199) return 30;
  if (amount >= 200 && amount <= 499) return 40;
  if (amount >= 500) return 50;
  return 0;
};

// ✅ COD to collect for this shopOrder
const getCodAmount = (order, shopOrder) => {
  const subtotal = Number(shopOrder?.subtotal || 0);
  const fee = calculateDeliveryFee(subtotal);

  if (order.paymentMethod === "cod") return subtotal + fee;

  // online payment
  if (order.payment === true) return 0; // already paid
  return subtotal + fee; // online but not captured
};

function DeliveryBoy() {
  const { userData, socket } = useSelector((state) => state.user);

  const [currentOrder, setCurrentOrder] = useState(null);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);

  const ratePerDelivery = 50;
  const totalEarning = todayDeliveries.reduce(
    (sum, d) => sum + d.count * ratePerDelivery,
    0
  );

  // ------------------- 📍 Geolocation Tracking -------------------
  useEffect(() => {
    if (!socket || userData?.role !== "deliveryBoy") return;

    let watchId;

    // Cached last location (fast first paint)
    try {
      const saved = localStorage.getItem("lastLocation");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.lat && parsed?.lon) {
          setDeliveryBoyLocation(parsed);
          console.log("⚡ Using cached location:", parsed);
        }
      }
    } catch (_) {}

    const handleSuccess = (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      console.log("📍 Position received:", latitude, longitude);

      const newLoc = { lat: latitude, lon: longitude };
      setDeliveryBoyLocation(newLoc);
      localStorage.setItem("lastLocation", JSON.stringify(newLoc));

      socket.emit("updateLocation", {
        latitude,
        longitude,
        userId: userData._id,
      });
    };

    const handleError = async (error) => {
      console.warn("❌ Geolocation error:", error.message);
      if (error.code === 1) {
        alert("📱 Please enable location access in your browser settings.");
      }
      console.log("⌛ Trying fallback (IP-based)...");
      try {
        const res = await axios.get("https://ipapi.co/json/");
        const { latitude, longitude } = res.data;
        const newLoc = { lat: latitude, lon: longitude };
        setDeliveryBoyLocation(newLoc);
        localStorage.setItem("lastLocation", JSON.stringify(newLoc));
        console.log("✅ Fallback location (IP) updated");
      } catch (err) {
        console.error("⚠️ IP fallback failed:", err.message);
      }
    };

    const requestLocation = () => {
      if (!navigator.geolocation) {
        console.warn("⚠️ Geolocation not supported — using fallback.");
        handleError({ message: "Geolocation not supported" });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPermissionGranted(true);
          handleSuccess(pos);
        },
        handleError,
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
      );

      watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 10000,
        }
      );
    };

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile && !permissionGranted) {
      console.log("📱 Waiting for user to enable location...");
    } else {
      requestLocation();
    }

    return () => {
      if (watchId !== undefined) navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, userData, permissionGranted]);

  // ------------------- 📦 Fetch Functions -------------------
  const getAssignments = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-assignments`, {
        withCredentials: true,
      });
      setAvailableAssignments(result.data || []);
    } catch (error) {
      console.log(error);
    }
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
      if (error.response?.data?.message === "assignment not found") {
        console.log("ℹ️ No current order assigned yet.");
        setCurrentOrder(null);
      } else {
        console.error(
          "❌ getCurrentOrder failed:",
          error.response?.data || error.message
        );
      }
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
    } catch (error) {
      console.log(error);
    }
  };

  const acceptOrder = async (assignmentId) => {
    try {
      await axios.get(`${serverUrl}/api/order/accept-order/${assignmentId}`, {
        withCredentials: true,
      });
      await getCurrentOrder();
      await handleTodayDeliveries();
      await getAssignments();
    } catch (error) {
      console.log(error);
    }
  };

  // ✅ NEW: Directly mark as delivered (no OTP)
  const completeDelivery = async () => {
    try {
      if (!currentOrder || !currentOrder.shopOrder) return;

      const orderId = currentOrder._id;
      const rawShop = currentOrder.shopOrder.shop;

      // shop can be populated object or plain ObjectId/string
      const shopId = rawShop?._id || rawShop;
      if (!shopId) {
        console.error("❌ No shopId in currentOrder.shopOrder");
        return;
      }

      setLoading(true);
      setMessage("");

      await axios.post(
        `${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
        { status: "delivered" },
        { withCredentials: true }
      );

      setMessage("✅ Delivery marked as completed.");

      // Refresh dashboard data
      await Promise.all([
        getCurrentOrder(), // will clear current if assignment is done
        handleTodayDeliveries(),
        getAssignments(),
      ]);
    } catch (error) {
      console.error("completeDelivery error:", error.response || error);
      setMessage("❌ Failed to update order status. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------- 🔄 Socket Listener -------------------
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

  // ------------------- ⚙️ Initial Load -------------------
  useEffect(() => {
    if (userData) {
      getAssignments();
      getCurrentOrder();
      handleTodayDeliveries();
    }
  }, [userData]);

  // ------------------- 🎨 Render -------------------
  const codAmountForCurrent =
    currentOrder && getCodAmount(currentOrder, currentOrder.shopOrder);

  return (
    <div className="w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto pb-10">
      <Nav />

      <div className="w-full max-w-[980px] flex flex-col gap-6 items-center mt-4">
        {/* 🧑‍✈️ Welcome / location */}
        <div className="bg-white rounded-2xl shadow-md p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between w-[92%] border border-orange-100 gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FiUser className="text-[#ff4d2d]" />
              Welcome,{" "}
              <span className="text-[#ff4d2d]">
                {userData?.fullName || "Delivery Partner"}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Deliver with care and collect payments accurately. 🚚
            </p>
          </div>

          <div className="text-sm text-[#ff4d2d] bg-orange-50 px-4 py-2 rounded-xl flex flex-col sm:items-end">
            <span className="font-semibold flex items-center gap-1">
              <FiMapPin /> Current Location
            </span>
            {deliveryBoyLocation ? (
              <span>
                {deliveryBoyLocation.lat.toFixed(4)},{" "}
                {deliveryBoyLocation.lon.toFixed(4)}
              </span>
            ) : (
              <span>📍 Fetching location...</span>
            )}

            {!deliveryBoyLocation && (
              <button
                onClick={() => setPermissionGranted(true)}
                className="mt-2 text-xs bg-[#ff4d2d] text-white px-3 py-1 rounded-full shadow hover:bg-orange-600"
              >
                Enable Location
              </button>
            )}
          </div>
        </div>

        {/* 📊 Deliveries & earnings */}
        <div className="bg-white rounded-2xl shadow-md p-5 w-[92%] border border-orange-100 flex flex-col lg:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-800">
              <FiClock className="text-[#ff4d2d]" />
              Today Deliveries
            </h1>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={todayDeliveries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [value, "orders"]}
                  labelFormatter={(label) => `${label}:00`}
                />
                <Bar dataKey="count" fill="#ff4d2d" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="w-full lg:w-64 flex flex-col justify-center">
            <div className="bg-white rounded-2xl shadow-lg border border-orange-100 px-6 py-5 text-center">
              <h2 className="text-base font-semibold text-gray-700 mb-1">
                Today&apos;s Earnings
              </h2>
              <p className="text-xs text-gray-400 mb-3">
                ₹{ratePerDelivery} per completed delivery
              </p>
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl font-extrabold text-green-600">
                  ₹{totalEarning}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 🧾 Available Orders */}
        {!currentOrder && (
          <div className="bg-white rounded-2xl p-5 shadow-md w-[92%] border border-orange-100">
            <h1 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiPackage className="text-[#ff4d2d]" />
              Available Orders
            </h1>
            <div className="space-y-4">
              {availableAssignments.length > 0 ? (
                availableAssignments.map((a, index) => {
                  const itemsCount = a.items?.reduce(
                    (sum, it) => sum + (it.quantity || 0),
                    0
                  );
                  const subtotal = Number(a.subtotal || 0);
                  const fee = calculateDeliveryFee(subtotal);
                  const codAmount = subtotal + fee;

                  const previewNames =
                    a.items && a.items.length
                      ? a.items
                          .slice(0, 2)
                          .map(
                            (it) =>
                              `${it.item?.name || it.name} × ${it.quantity}`
                          )
                          .join(", ")
                      : "Items not available";

                  const moreCount =
                    a.items && a.items.length > 2
                      ? a.items.length - 2
                      : 0;

                  return (
                    <div
                      key={index}
                      className="border border-orange-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-orange-50/40 hover:bg-orange-50 transition"
                    >
                      <div className="space-y-1 text-sm">
                        <p className="font-semibold text-gray-900 flex items-center gap-1">
                          <FiShoppingBag className="text-[#ff4d2d]" />
                          {a?.shopName}
                        </p>
                        <p className="text-gray-600 flex items-start gap-1 text-xs sm:text-sm">
                          <FiMapPin className="mt-[3px] text-[#ff4d2d]" />
                          <span>{a?.deliveryAddress?.text}</span>
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-semibold">
                            {itemsCount} item{itemsCount === 1 ? "" : "s"}:
                          </span>{" "}
                          {previewNames}
                          {moreCount > 0 && (
                            <span className="text-gray-400">
                              {" "}
                              + {moreCount} more
                            </span>
                          )}
                        </p>

                        <p className="text-xs text-gray-700 mt-1">
                          <span className="font-semibold">Subtotal:</span> ₹
                          {subtotal} |{" "}
                          <span className="font-semibold">Delivery Fee:</span> ₹
                          {fee}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          Amount to Collect (COD):{" "}
                          <span className="text-[#ff4d2d] text-base">
                            ₹{codAmount}
                          </span>
                        </p>
                      </div>

                      <button
                        className="self-end sm:self-center bg-[#ff4d2d] text-white px-5 py-2 rounded-lg text-sm font-semibold shadow-md hover:bg-[#e64526] active:scale-95 transition"
                        onClick={() => acceptOrder(a.assignmentId)}
                      >
                        Accept
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-400 text-sm">
                  No available orders right now. You&apos;ll be notified when a
                  new one comes in.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 🚚 Current Order */}
        {currentOrder && (
          <div className="bg-white rounded-2xl p-5 shadow-md w-[92%] border border-orange-100 flex flex-col gap-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FiPackage className="text-[#ff4d2d]" /> Current Order
            </h2>

            {/* Order summary card */}
            <div className="border border-orange-100 rounded-xl p-4 bg-orange-50/40 flex flex-col gap-2">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-gray-900 flex items-center gap-1">
                    <FiShoppingBag className="text-[#ff4d2d]" />
                    {currentOrder?.shopOrder?.shop?.name ||
                      "Assigned Restaurant"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Customer:{" "}
                    <span className="font-semibold">
                      {currentOrder?.user?.fullName}
                    </span>
                  </p>
                </div>
                <div className="text-xs text-gray-500 text-right">
                  <p>
                    Order ID:{" "}
                    <span className="font-mono">
                      #{currentOrder?._id?.slice(-6)}
                    </span>
                  </p>
                  <p>
                    Mode:{" "}
                    {currentOrder.paymentMethod === "online"
                      ? currentOrder.payment
                        ? "Prepaid"
                        : "Online (Pending)"
                      : "COD"}
                  </p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 flex items-start gap-1 mt-2">
                <FiMapPin className="mt-[3px] text-[#ff4d2d]" />
                <span>{currentOrder?.deliveryAddress?.text}</span>
              </p>

              {/* Items list for current order */}
              <div className="mt-3 bg-white rounded-lg border border-orange-100 p-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Items to Deliver
                </p>
                <div className="space-y-1 max-h-32 overflow-y-auto text-xs sm:text-sm">
                  {currentOrder.shopOrder.shopOrderItems.map((it, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center text-gray-700"
                    >
                      <span>
                        {it.item?.name || it.name}{" "}
                        <span className="text-gray-400">
                          × {it.quantity}
                        </span>
                      </span>
                      <span className="font-medium">
                        ₹{it.price * it.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-orange-100 mt-2 pt-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{currentOrder.shopOrder.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>
                      ₹{calculateDeliveryFee(currentOrder.shopOrder.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold mt-1">
                    <span>Amount to Collect (COD)</span>
                    <span className="text-[#ff4d2d]">
                      ₹{codAmountForCurrent}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <DeliveryBoyTracking
              data={{
                deliveryBoyLocation:
                  deliveryBoyLocation || {
                    lat: userData?.location?.coordinates?.[1],
                    lon: userData?.location?.coordinates?.[0],
                  },
                customerLocation: {
                  lat: currentOrder.deliveryAddress.latitude,
                  lon: currentOrder.deliveryAddress.longitude,
                },
              }}
            />

            {/* ✅ Simple Complete Delivery button (no OTP) */}
            <div className="mt-4 flex flex-col gap-2">
              <button
                className="w-full bg-green-500 text-white font-semibold py-3 px-4 rounded-xl shadow-md hover:bg-green-600 active:scale-95 transition-all duration-150 text-sm sm:text-base"
                onClick={completeDelivery}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <ClipLoader size={20} color="white" />
                    <span>Completing delivery...</span>
                  </span>
                ) : (
                  "Complete Delivery"
                )}
              </button>

              {message && (
                <p className="text-center text-sm text-gray-700">{message}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryBoy;
