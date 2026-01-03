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
import path from "path";

const app = express();
app.set("trust proxy", 1);

const server = http.createServer(app);

const FRONTEND_URL = "https://kottam-frontend.vercel.app";




// -------------------------
// FIX 1: CORS FOR COOKIES
// -------------------------
app.use(
  cors({
    origin: [
      "https://kottam-frontend.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);
// -------------------------
// FIX 4: SOCKET.IO WITH FRONTEND_URL
// -------------------------
const io = new Server(server, {
  cors: {
  origin: [
    "https://kottam-frontend.vercel.app",
    "http://localhost:5173",
  ],
  credentials: true,
},


  // 🔥 CRITICAL FOR RENDER
  transports: ["polling", "websocket"], // DO NOT remove polling
  allowEIO3: true,

  // 🔥 Prevent proxy timeouts
  pingTimeout: 60000,
  pingInterval: 25000,
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








