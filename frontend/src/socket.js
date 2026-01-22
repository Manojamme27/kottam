import { io } from "socket.io-client";

const serverUrl = import.meta.env.VITE_SERVER_URL;

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(serverUrl, {
      withCredentials: true,
      autoConnect: false,          // 🔥 CRITICAL
      transports: ["websocket"],   // no polling
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};
