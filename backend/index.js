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

// 🔥 Allowed frontend URLs
const allowedOrigins = [
    "http://localhost:5173",
    "https://kottam-frontend.vercel.app",
    "https://kottam.vercel.app"
];

// 🔥 CORS for Express
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

// Serve uploads folder
app.use("/uploads", express.static("uploads"));

// 🔥 Socket.IO with proper CORS
const io = new Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST"]
    }
});

// attach socket to app
app.set("io", io);

// Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

// Socket Handler
socketHandler(io);

// Start server
const port = process.env.PORT || 5000;
server.listen(port, () => {
    connectDb();
    console.log(`server started at ${port}`);
});
