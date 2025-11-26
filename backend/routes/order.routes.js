import { getOwnerStats } from "../controllers/orderStats.controller.js";
import express from "express"
import isAuth from "../middlewares/isAuth.js"
import { acceptOrder, getCurrentOrder, getDeliveryBoyAssignment, getMyOrders, getTodayDeliveries, placeOrder, updateOrderStatus, verifyPayment,getOrderById,  cancelOrder } from "../controllers/order.controllers.js"




const orderRouter = express.Router()
orderRouter.get("/stats/owner", isAuth, getOwnerStats);
orderRouter.post("/place-order", isAuth, placeOrder)
orderRouter.post("/verify-payment", isAuth, verifyPayment)
orderRouter.get("/my-orders", isAuth, getMyOrders)
orderRouter.get("/get-assignments", isAuth, getDeliveryBoyAssignment)
orderRouter.get("/get-current-order", isAuth, getCurrentOrder)
orderRouter.post("/update-status/:orderId/:shopId", isAuth, updateOrderStatus)
orderRouter.get('/accept-order/:assignmentId', isAuth, acceptOrder)
orderRouter.get('/get-today-deliveries', isAuth, getTodayDeliveries)
orderRouter.put("/cancel/:orderId", isAuth, cancelOrder)
orderRouter.get("/get-order-by-id/:orderId", isAuth, getOrderById);





export default orderRouter

