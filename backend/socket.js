import User from "./models/user.model.js";

export const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 Socket connected:", socket.id);

    // ✅ REGISTER USER
    socket.on("identity", async ({ userId, role }) => {
      try {
        if (!userId) return;

        await User.findByIdAndUpdate(userId, {
          socketId: socket.id,
          isOnline: true,
          lastSeen: new Date(),
        });

        socket.join(userId);

        socket.emit("identity-ack");
        console.log(`🔗 Registered ${role || "user"} → ${userId}`);
      } catch (err) {
        console.error("identity error", err);
      }
    });

    // ✅ LOCATION UPDATE (SAFE)
    socket.on("updateLocation", async ({ latitude, longitude, userId }) => {
      if (!userId || !latitude || !longitude) return;

      try {
        await User.findByIdAndUpdate(userId, {
          location: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          socketId: socket.id,
          isOnline: true,
        });

        io.emit("updateDeliveryLocation", {
          deliveryBoyId: userId,
          latitude,
          longitude,
        });
      } catch (err) {
        console.error("updateLocation error", err);
      }
    });

    // ✅ DISCONNECT (DO NOT BLOCK)
    socket.on("disconnect", async () => {
      try {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          {
            socketId: null,
            isOnline: false,
            lastSeen: new Date(),
          }
        );
        console.log("🔴 Socket disconnected:", socket.id);
      } catch (err) {
        console.error("disconnect error", err);
      }
    });
  });
};

