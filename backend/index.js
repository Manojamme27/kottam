import express from "express"
import dotenv from "dotenv"
dotenv.config()
import connectDb from "./config/db.js"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes.js"
import cors from "cors"
import userRouter from "./routes/user.routes.js"
import itemRouter from "./routes/item.routes.js"
import shopRouter from "./routes/shop.routes.js"
import orderRouter from "./routes/order.routes.js"
import http from "http"
import { socketHandler } from "./socket.js"
import { Server } from "socket.io"

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        credentials: true,
        methods: ['POST', 'GET']
    }
});

app.set("io", io)

const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5000;

app.use(
    cors({
        origin: isProduction
            ? "https://kottam.onrender.com"
            : "http://localhost:5173",
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

// ✅ This must come BEFORE routes
app.use("/uploads", express.static("uploads"));

// ✅ API Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

// ✅ Socket.IO setup
socketHandler(io);

server.listen(port, () => {
    connectDb();
    console.log(`server started at ${port}`);
});
