import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import itemRouter from "./routes/item.routes.js";
import shopRouter from "./routes/shop.routes.js";
import orderRouter from "./routes/order.routes.js";
import http from "http";
import { socketHandler } from "./socket.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// -------------------------
// FIX 1: CORS FOR COOKIES
// -------------------------
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// -------------------------
// FIX 2: JSON + COOKIES
// -------------------------
app.use(express.json());
app.use(cookieParser());

// -------------------------
// FIX 3: STATIC FILES
// -------------------------
app.use("/uploads", express.static("uploads"));

// -------------------------
// FIX 4: SOCKET.IO WITH FRONTEND_URL
// -------------------------
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
});
app.set("io", io);

// -------------------------
// ROUTES
// -------------------------
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

// SOCKET
socketHandler(io);

// -------------------------
// START SERVER
// -------------------------
const port = process.env.PORT || 8000;
server.listen(port, () => {
  connectDb();
  console.log("server started at", port);
});
