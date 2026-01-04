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
      // allow Postman, server-to-server, mobile apps
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // silently reject other origins
      return callback(null, false);
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
  transports: ["polling", "websocket"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set("io", io);

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
