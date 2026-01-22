import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { getSocket } from "../socket";
import {
  addMyOrder,
  updateRealtimeOrderStatus,
  setSocket,
} from "../redux/userSlice";

const playSound = () => {
  const audio = new Audio("/notify.mp3");
  audio.play().catch(() => {});
};

const useSocket = () => {
  const dispatch = useDispatch();
  const { userData, authChecked } = useSelector((state) => state.user);

  useEffect(() => {
    if (!authChecked || !userData?._id) return;

    const socket = getSocket();

    // 🟢 CONNECT AFTER UI IS READY (NON-BLOCKING)
    const timer = setTimeout(() => {
      if (!socket.connected) {
        socket.connect();
      }
    }, 2000); // 🔥 UI FIRST

    socket.on("connect", () => {
      console.log("🟢 socket connected");
    });

    socket.on("connect_error", () => {
      console.log("⚠️ socket failed (ignored)");
    });

    socket.on("newOrder", (order) => {
      playSound();
      toast.success("New order received");
      dispatch(addMyOrder(order));
    });

    socket.on("update-status", (data) => {
      dispatch(updateRealtimeOrderStatus(data));
    });

    dispatch(setSocket(socket));

    return () => {
      clearTimeout(timer);
      socket.off("connect");
      socket.off("connect_error");
      socket.off("newOrder");
      socket.off("update-status");
    };
  }, [authChecked, userData?._id, dispatch]);
};

export default useSocket;
