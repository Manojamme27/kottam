import ProtectedRoute from "./ProtectedRoute";
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

// Server URL
export const serverUrl = import.meta.env.VITE_SERVER_URL;

// 🔊 Play notification sound
const playSound = () => {
  const audio = new Audio("/notify.mp3");
  audio.volume = 1;
  audio.play().catch(() => {});
};

function App() {
  const dispatch = useDispatch();
  const { userData, authChecked } = useSelector(state => state.user);

  // ✅ ALL HOOKS FIRST — NO RETURNS BEFORE THIS
  useGetCurrentUser();
  useGetCity();
  useUpdateLocation();
  useGetMyshop();
  useGetItemsByCity();
  useGetMyOrders();

  useEffect(() => {
    if (!userData?._id) return;

    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.emit("identity", { userId: userData._id });

    socket.on("newOrder", (orderData) => {
      playSound();
      toast.success("New Order Received");
      dispatch(addMyOrder(orderData));
    });

    socket.on("update-status", (data) => {
      playSound();
      toast.info(`Order status updated: ${data.status}`);
      dispatch(updateRealtimeOrderStatus(data));
    });

    dispatch(setSocket(socket));

    return () => socket.disconnect();
  }, [userData?._id, dispatch]);

  // ✅ RETURN ONLY AFTER ALL HOOKS
  if (!authChecked) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Routes>
  {/* Public routes */}
  <Route path="/signup" element={<SignUp />} />
  <Route path="/signin" element={<SignIn />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />

  {/* Protected routes */}
  <Route
    path="/"
    element={
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    }
  />

  <Route
    path="/create-edit-shop"
    element={
      <ProtectedRoute>
        <CreateEditShop />
      </ProtectedRoute>
    }
  />

  <Route
    path="/add-item"
    element={
      <ProtectedRoute>
        <AddItem />
      </ProtectedRoute>
    }
  />

  <Route
    path="/edit-item/:itemId"
    element={
      <ProtectedRoute>
        <EditItem />
      </ProtectedRoute>
    }
  />

  <Route
    path="/cart"
    element={
      <ProtectedRoute>
        <CartPage />
      </ProtectedRoute>
    }
  />

  <Route
    path="/checkout"
    element={
      <ProtectedRoute>
        <CheckOut />
      </ProtectedRoute>
    }
  />

  <Route
    path="/order-placed"
    element={
      <ProtectedRoute>
        <OrderPlaced />
      </ProtectedRoute>
    }
  />

  <Route
    path="/my-orders"
    element={
      <ProtectedRoute>
        <MyOrders />
      </ProtectedRoute>
    }
  />

  <Route
    path="/track-order/:orderId"
    element={
      <ProtectedRoute>
        <TrackOrderPage />
      </ProtectedRoute>
    }
  />

  <Route
    path="/shop/:shopId"
    element={
      <ProtectedRoute>
        <Shop />
      </ProtectedRoute>
    }
  />
</Routes>

      <ToastContainer position="top-center" autoClose={2300} theme="colored" />
    </>
  );
}

export default App;
