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
import { CronJob } from "cron";
import fetch from "node-fetch";


const app = express();
app.set("trust proxy", 1);

const server = http.createServer(app);

const FRONTEND_URL = "https://kottam-frontend.vercel.app";

/* ===============================
   BODY + COOKIE PARSER
================================ */
app.use(express.json());
app.use(cookieParser());

/* ===============================
   CORS (NO WILDCARDS)
================================ */
const allowedOrigins = [
  "https://kottam-frontend.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, origin); // 🔥 IMPORTANT
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);


/* ===============================
   STATIC FILES
================================ */
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

/* ===============================
   SOCKET.IO (UNCHANGED)
================================ */
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
  transports: ["websocket"],
  allowUpgrades: false,      // 🔥 BLOCK polling
  pingTimeout: 20000,     // 🔥 FAST fail
  pingInterval: 25000,
  allowEIO3: true,
});

app.set("io", io);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
  });
});

const keepAliveJob = new CronJob(
  "*/10 * * * *",
  async () => {
    try {
      await fetch("https://kottam-backend.onrender.com/health");
      console.log("🔁 Keep-alive ping");
    } catch (err) {
      console.log("⚠️ Keep-alive failed");
    }
  },
  null,
  true
);

keepAliveJob.start();



/* ===============================
   ROUTES
================================ */
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);


/* ===============================
   SOCKET HANDLER
================================ */
socketHandler(io);

/* ===============================
   START SERVER
================================ */
const port = process.env.PORT || 8000;
server.listen(port, () => {
  connectDb();
  console.log("server started at", port);
});







