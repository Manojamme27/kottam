import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Hooks
import useGetCity from "./hooks/useGetCity";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import useGetItemsByCity from "./hooks/useGetItemsByCity";
import useGetMyOrders from "./hooks/useGetMyOrders";
import useGetMyshop from "./hooks/useGetMyShop";
import useGetShopByCity from "./hooks/useGetShopByCity";
import useUpdateLocation from "./hooks/useUpdateLocation";

// Pages
import AddItem from "./pages/AddItem";
import CartPage from "./pages/CartPage";
import CheckOut from "./pages/CheckOut";
import EditItem from "./pages/EditItem";
import ForgotPassword from "./pages/ForgotPassword";
import MyOrders from "./pages/MyOrders";
import OrderPlaced from "./pages/OrderPlaced";
import Shop from "./pages/Shop";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import TrackOrderPage from "./pages/TrackOrderPage";
import CreateEditShop from "./pages/CreateEditShop";
import Home from "./pages/Home";

// Redux
import { setSocket, addMyOrder, updateRealtimeOrderStatus } from "./redux/userSlice";

// Server URL
export const serverUrl = import.meta.env.VITE_SERVER_URL;

// 🔊 Play notification sound
const playSound = () => {
  const audio = new Audio("/notify.mp3");
  audio.volume = 1;
  audio.play().catch(() => {});
};

function App() {
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // Initialize hooks
  useGetCurrentUser();
  useUpdateLocation();
  useGetCity();
  useGetMyshop();
  useGetShopByCity();
  useGetItemsByCity();
  useGetMyOrders();

  // ===============================
  // ⚡ SOCKET SETUP (FULL REALTIME)
  // ===============================
  useEffect(() => {
    if (!userData?._id) return;

    // Ensure only 1 socket instance
    let socket = io(serverUrl, {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socket.on("connect", () => {
      console.log("🔌 SOCKET CONNECTED:", socket.id);

      // Identify user to server
      socket.emit("identity", { userId: userData._id });
    });

    socket.on("disconnect", () => {
      console.log("❌ SOCKET DISCONNECTED");
    });

    // Re-identify after reconnect
    socket.on("reconnect", () => {
      console.log("🔄 SOCKET RECONNECTED:", socket.id);
      socket.emit("identity", { userId: userData._id });
    });

    // ================================
    // 🔥 REALTIME EVENTS FOR ALL ROLES
    // ================================

    // OWNER → New Order Received
    socket.on("newOrder", (orderData) => {
      playSound();
      toast.success("New Order Received");
      dispatch(addMyOrder(orderData));
    });

    // USER → Status Update
    socket.on("update-status", (data) => {
      playSound();
      toast.info(`Order status updated: ${data.status}`);
      dispatch(updateRealtimeOrderStatus(data));
    });

    // DELIVERY BOY → New Assignment
    socket.on("newAssignment", (assignment) => {
      playSound();
      toast.success(`New Delivery Assignment from ${assignment.shopName}`);
    });

    dispatch(setSocket(socket));

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [userData?._id]);

  return (
    <>
      {/* Routes */}
      <Routes>
        <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/" />} />
        <Route path="/signin" element={!userData ? <SignIn /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!userData ? <ForgotPassword /> : <Navigate to="/" />} />
        <Route path="/" element={userData ? <Home /> : <Navigate to="/signin" />} />
        <Route path="/create-edit-shop" element={userData ? <CreateEditShop /> : <Navigate to="/signin" />} />
        <Route path="/add-item" element={userData ? <AddItem /> : <Navigate to="/signin" />} />
        <Route path="/edit-item/:itemId" element={userData ? <EditItem /> : <Navigate to="/signin" />} />
        <Route path="/cart" element={userData ? <CartPage /> : <Navigate to="/signin" />} />
        <Route path="/checkout" element={userData ? <CheckOut /> : <Navigate to="/signin" />} />
        <Route path="/order-placed" element={userData ? <OrderPlaced /> : <Navigate to="/signin" />} />
        <Route path="/my-orders" element={userData ? <MyOrders /> : <Navigate to="/signin" />} />
        <Route path="/track-order/:orderId" element={userData ? <TrackOrderPage /> : <Navigate to="/signin" />} />
        <Route path="/shop/:shopId" element={userData ? <Shop /> : <Navigate to="/signin" />} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-center"
        autoClose={2300}
        theme="colored"
        toastStyle={{
          backgroundColor: "#fff9f6",
          color: "#333",
          borderRadius: "10px",
          fontFamily: "Inter, sans-serif",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        }}
      />
    </>
  );
}

export default App;
