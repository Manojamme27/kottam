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
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData?._id) return;

    const socket = getSocket();

    // 🔥 DELAY socket so UI renders first
    const timer = setTimeout(() => {
      socket.connect();
    }, 1500);

    socket.on("connect", () => {
      console.log("🟢 socket connected");
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
      socket.off("newOrder");
      socket.off("update-status");
    };
  }, [userData?._id, dispatch]);
};

export default useSocket;
