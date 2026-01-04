import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Routes, Route } from "react-router-dom";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import useGetCurrentUser from "./hooks/useGetCurrentUser";
import useGetCity from "./hooks/useGetCity";
import useGetItemsByCity from "./hooks/useGetItemsByCity";
import useGetMyOrders from "./hooks/useGetMyOrders";
import useGetMyshop from "./hooks/useGetMyShop";
import useUpdateLocation from "./hooks/useUpdateLocation";

import ProtectedRoute from "./ProtectedRoute";

import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import CartPage from "./pages/CartPage";
import MyOrders from "./pages/MyOrders";
import Shop from "./pages/Shop";
import CheckOut from "./pages/CheckOut";
import AddItem from "./pages/AddItem";
import EditItem from "./pages/EditItem";
import CreateEditShop from "./pages/CreateEditShop";
import TrackOrderPage from "./pages/TrackOrderPage";
import OrderPlaced from "./pages/OrderPlaced";

import { setSocket, addMyOrder, updateRealtimeOrderStatus } from "./redux/userSlice";

export const serverUrl = import.meta.env.VITE_SERVER_URL;

function App() {
  const dispatch = useDispatch();
  const { userData, authChecked } = useSelector(state => state.user);

  // ✅ ONLY auth hook runs before authChecked
  useGetCurrentUser();

  // ⛔ BLOCK everything until auth is resolved
  if (!authChecked) {
    return <div>Loading...</div>;
  }

  // ✅ SAFE hooks — run ONLY after authChecked
  useGetCity();

  if (userData?._id) {
    useUpdateLocation();
    useGetMyshop();
    useGetItemsByCity();
    useGetMyOrders();
  }

  // ✅ Socket AFTER user exists
  useEffect(() => {
    if (!userData?._id) return;

    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.emit("identity", { userId: userData._id });

    socket.on("newOrder", (order) => {
      toast.success("New Order Received");
      dispatch(addMyOrder(order));
    });

    socket.on("update-status", (data) => {
      toast.info(`Order status updated: ${data.status}`);
      dispatch(updateRealtimeOrderStatus(data));
    });

    dispatch(setSocket(socket));

    return () => socket.disconnect();
  }, [userData?._id, dispatch]);

  return (
    <>
      <Routes>
        {/* PUBLIC */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* PROTECTED */}
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CheckOut /></ProtectedRoute>} />
        <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
        <Route path="/shop/:shopId" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
        <Route path="/add-item" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
        <Route path="/edit-item/:itemId" element={<ProtectedRoute><EditItem /></ProtectedRoute>} />
        <Route path="/create-edit-shop" element={<ProtectedRoute><CreateEditShop /></ProtectedRoute>} />
        <Route path="/track-order/:orderId" element={<ProtectedRoute><TrackOrderPage /></ProtectedRoute>} />
        <Route path="/order-placed" element={<ProtectedRoute><OrderPlaced /></ProtectedRoute>} />
      </Routes>

      <ToastContainer position="top-center" autoClose={2300} theme="colored" />
    </>
  );
}

export default App;
