export const serverUrl = import.meta.env.VITE_SERVER_URL;

import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Route, Routes } from "react-router-dom";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Hooks
import useGetCity from "./hooks/useGetCity";
import useGetCurrentUser from "./hooks/useGetCurrentUser";
import useGetItemsByCity from "./hooks/useGetItemsByCity";
import useGetMyOrders from "./hooks/useGetMyOrders";
import useGetMyshop from "./hooks/useGetMyShop";
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
import {
  setSocket,
  addMyOrder,
  updateRealtimeOrderStatus,
} from "./redux/userSlice";

// 🔌 SOCKET INSTANCE (DO NOT AUTO CONNECT)
const socket = io(serverUrl, {
  withCredentials: true,
  autoConnect: false, // 🔥 VERY IMPORTANT
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 2000,
});

// 🔊 Sound
const playSound = () => {
  const audio = new Audio("/notify.mp3");
  audio.volume = 1;
  audio.play().catch(() => {});
};

function App() {
  const dispatch = useDispatch();
  const { userData, authChecked } = useSelector((state) => state.user);

  // 🔥 Wake backend early (does NOT block UI)
 useEffect(() => {
  const wake = () => {
    fetch(`${serverUrl}/health`, {
      credentials: "include",
    }).catch(() => {});
  };

  wake(); // on load

  const id = setInterval(wake, 5 * 60 * 1000); // every 5 min

  return () => clearInterval(id);
}, []);

  // ✅ DATA FIRST — NO SOCKET DEPENDENCY
  useGetCurrentUser();
  useGetCity();
  useUpdateLocation();
  useGetMyshop();
  useGetItemsByCity();
  useGetMyOrders();

  // 🟢 CONNECT SOCKET *AFTER* UI + AUTH (DELAYED)
  useEffect(() => {
    if (!authChecked || !userData?._id) return;

    const timer = setTimeout(() => {
      socket.connect();
      dispatch(setSocket(socket));
    }, 2000); // 🔥 2s delay = instant UI

    return () => clearTimeout(timer);
  }, [authChecked, userData?._id, dispatch]);

  // 🔔 SOCKET EVENTS (NON-BLOCKING)
useEffect(() => {
  if (!userData?._id) return;

  // 🔥 Delay socket so UI renders first
  const timer = setTimeout(() => {
    socket.connect();
  }, 2000);

  socket.on("connect", () => {
    console.log("🟢 socket connected", socket.id);
  });

  socket.on("connect_error", () => {
    console.log("⚠️ socket connect failed (ignored)");
  });

  socket.on("disconnect", () => {
    console.log("🔴 socket disconnected");
  });

  dispatch(setSocket(socket));

  return () => {
    clearTimeout(timer);
    socket.off("connect");
    socket.off("connect_error");
    socket.off("disconnect");
  };
}, [userData?._id, dispatch]);
  


  return (
    <>
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

      <ToastContainer position="top-center" autoClose={2300} theme="colored" />
    </>
  );
}

export default App;
