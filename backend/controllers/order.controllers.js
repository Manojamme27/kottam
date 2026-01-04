import DeliveryAssignment from "../models/deliveryAssignment.model.js";
import Order from "../models/order.model.js";
import Shop from "../models/shop.model.js";
import User from "../models/user.model.js";
import RazorPay from "razorpay";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

let instance = new RazorPay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================================
//  PLACE ORDER
// ============================================================
export const placeOrder = async (req, res) => {
    try {
        const { cartItems, paymentMethod, deliveryAddress, totalAmount } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "cart is empty" });
        }
        // ============================================================
// ❌ BLOCK MULTI-SHOP ORDERS
// ============================================================
const uniqueShopIds = [
  ...new Set(
    cartItems.map(item =>
      typeof item.shop === "object" ? item.shop._id : item.shop
    )
  ),
];

if (uniqueShopIds.length > 1) {
  return res.status(400).json({
    message: "You can order items from only one shop at a time",
  });
}

        if (!deliveryAddress.text || !deliveryAddress.latitude || !deliveryAddress.longitude) {
            return res.status(400).json({ message: "send complete deliveryAddress" });
        }

        // normalize: cartItems[i].shop = shopId string
        cartItems.forEach(i => {
            if (typeof i.shop === "object" && i.shop._id) {
                i.shop = i.shop._id;
            }
        });

        // group items by shop
        const groupItemsByShop = {};
        cartItems.forEach(item => {
            const shopId = item.shop;
            if (!groupItemsByShop[shopId]) {
                groupItemsByShop[shopId] = [];
            }
            groupItemsByShop[shopId].push(item);
        });

        // build shopOrders
        const shopOrders = await Promise.all(
            Object.keys(groupItemsByShop).map(async (shopId) => {
                const shop = await Shop.findById(shopId).populate("owner");
                if (!shop) return res.status(400).json({ message: "shop not found" });

                const items = groupItemsByShop[shopId];
                const subtotal = items.reduce(
                    (sum, i) => sum + Number(i.price) * Number(i.quantity),
                    0
                );
                // ⭐ Minimum ₹100 per shop
if (subtotal < 100) {
    return res.status(400).json({
        message: `Minimum order ₹100 required for shop: ${shop.name}`
    });
}


                let deliveryFee = 0;
                if (subtotal >= 100 && subtotal <= 199) deliveryFee = 30;
                else if (subtotal >= 200 && subtotal <= 499) deliveryFee = 40;
                else if (subtotal >= 500) deliveryFee = 50;

                return {
                    shop: shop._id,
                    owner: shop.owner._id,
                    subtotal,
                    deliveryFee,
                    status: "pending",  
                    shopOrderItems: items.map((i) => ({
                        item: i.id,
                        price: i.price,
                        quantity: i.quantity,
                        name: i.name,
                    })),
                };
            })
        );

        // 🔥 PER-SHOP MINIMUM ₹100 CHECK
        for (const so of shopOrders) {
            // if any mapping above returned an early res (shop not found),
            // `so` could be undefined → skip those safely
            if (!so) continue;

            if (so.subtotal < 100) {
                return res.status(400).json({
                    message: "Minimum order ₹100 required for each shop.",
                    shopId: so.shop,
                    subtotal: so.subtotal,
                });
            }
        }

        // -----------------------------
        // ONLINE PAYMENT FLOW
        // -----------------------------
        if (paymentMethod === "online") {
            const razorOrder = await instance.orders.create({
                amount: Math.round(totalAmount * 100),
                currency: "INR",
                receipt: `receipt_${Date.now()}`,
            });

            const newOrder = await Order.create({
                user: req.userId,
                paymentMethod,
                deliveryAddress,
                totalAmount,
                shopOrders,
                razorpayOrderId: razorOrder.id,
                payment: false,
            });

            return res.status(200).json({
                razorOrder,
                orderId: newOrder._id,
            });
        }

        // -----------------------------
        // COD FLOW
        // -----------------------------
  const newOrder = await Order.create({
  user: req.userId,
  paymentMethod,
  deliveryAddress,
  totalAmount,
  shopOrders,
});

await newOrder.populate("user", "fullName email mobile");
await newOrder.populate("shopOrders.shop", "name");
await newOrder.populate("shopOrders.owner", "name socketId");
await newOrder.populate("shopOrders.shopOrderItems.item", "name image price");

const io = req.app.get("io");

if (io) {
  newOrder.shopOrders.forEach((shopOrder) => {
    const ownerSocketId = shopOrder.owner.socketId;

    if (ownerSocketId) {
      io.to(ownerSocketId).emit("newOrder", {
        _id: newOrder._id,
        paymentMethod: newOrder.paymentMethod,
        user: newOrder.user,          // ✅ FULL USER
        shopOrders: shopOrder,
        createdAt: newOrder.createdAt,
        deliveryAddress: newOrder.deliveryAddress,
        payment: newOrder.payment,
      });
    }
  });
}

return res.status(201).json(newOrder);


// ============================================================
//  VERIFY PAYMENT
// ============================================================
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, orderId } = req.body;
        const payment = await instance.payments.fetch(razorpay_payment_id);

        if (!payment || payment.status !== "captured") {
            return res.status(400).json({ message: "payment not captured" });
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(400).json({ message: "order not found" });

        order.payment = true;
        order.razorpayPaymentId = razorpay_payment_id;
        await order.save();

        await order.populate("user", "fullName email mobile");
await order.populate("shopOrders.shop", "name");
await order.populate("shopOrders.owner", "name socketId");
await order.populate("shopOrders.shopOrderItems.item", "name image price");


        const io = req.app.get("io");
        if (io) {
            order.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner.socketId;
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit("newOrder", {
                        _id: order._id,
                        paymentMethod: order.paymentMethod,
                        user: order.user,
                        shopOrders: shopOrder,
                        createdAt: order.createdAt,
                        deliveryAddress: order.deliveryAddress,
                        payment: order.payment
                    });
                }
            });
        }

        return res.status(200).json(order);
    } catch (error) {
        console.error("🔥 VERIFY PAYMENT ERROR:", error);
        return res.status(500).json({ message: `verify payment error ${error}` });
    }
};

// ============================================================
//  GET MY ORDERS (USER / OWNER)
// ============================================================
// ============================================================
//  GET MY ORDERS (USER / OWNER)
// ============================================================
export const getMyOrders = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ================= USER VIEW =================
    if (user.role === "user") {
      const orders = await Order.find({ user: req.userId })
  .sort({ createdAt: -1 })
  .populate("user", "fullName email mobile")
  .populate("shopOrders.shop", "name")
  .populate("shopOrders.owner", "fullName email mobile")
  .populate("shopOrders.shopOrderItems.item", "name image price");


      return res.status(200).json(orders);
    }

    // ================= OWNER VIEW =================
if (user.role === "owner") {
  const orders = await Order.find({ "shopOrders.owner": req.userId })
    .sort({ createdAt: -1 })
    .populate("shopOrders.shop", "name")
    .populate("shopOrders.owner", "fullName email mobile socketId")
    .populate("user", "fullName email mobile")
    .populate("shopOrders.shopOrderItems.item", "name image price")
    .populate("shopOrders.assignedDeliveryBoy", "fullName mobile");

  const filtered = [];

  for (const order of orders) {
    // ✅ NEVER DROP ORDER
    if (!order.user) {
      order.user = {
        fullName: "Unknown User",
        email: "",
        mobile: "",
      };
    }

    const validShopOrders = order.shopOrders.filter(
      so => String(so.owner?._id || so.owner) === String(req.userId)
    );

    if (!validShopOrders.length) continue;

    filtered.push({
      _id: order._id,
      paymentMethod: order.paymentMethod,
      user: order.user,
      createdAt: order.createdAt,
      deliveryAddress: order.deliveryAddress,
      payment: order.payment,
      shopOrders: validShopOrders,
    });
  }

  return res.status(200).json(filtered);
}





    return res.status(403).json({ message: "Invalid role" });

  } catch (error) {
    console.error("GET MY ORDERS ERROR ❌", error);
    return res.status(500).json({ message: "Get orders failed" });
  }
};

// ============================================================
//  UPDATE ORDER STATUS
// ============================================================
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId, shopId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);
        if (!order) return res.status(400).json({ message: "order not found" });

        let shopOrder = order.shopOrders.find(o => String(o.shop) === String(shopId));
        if (!shopOrder) return res.status(400).json({ message: "shop order not found" });

        let availableBoys = [];

        // NORMAL STATUS UPDATE (preparing / cancelled / pending)
        if (status && status !== "delivered" && status !== "out of delivery") {
            shopOrder.status = status;
        }

        // ============================================================
        //  DELIVERED
        // ============================================================
        if (status === "delivered") {
            shopOrder.status = "delivered";
            shopOrder.deliveredAt = new Date();

            await DeliveryAssignment.deleteOne({
                shopOrderId: shopOrder._id,
                order: orderId,
                assignedTo: shopOrder.assignedDeliveryBoy
            });

            await order.save();

            return res.status(200).json({
                message: "Order marked as delivered",
                shopOrder
            });
        }

        // ============================================================
        //  OUT OF DELIVERY → AUTO ASSIGN NEARBY DELIVERY BOY
        // ============================================================
        if (status === "out of delivery") {
            shopOrder.status = "out of delivery";

            const { longitude, latitude } = order.deliveryAddress;

            const nearByDeliveryBoys = await User.find({
                role: "deliveryBoy",
                location: {
                    $near: {
                        $geometry: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
                        $maxDistance: 15000
                    }
                }
            });

            if (!nearByDeliveryBoys.length) {
                await order.save();
                return res.status(200).json({
                    message: "No delivery boys available",
                    shopOrder
                });
            }

            const nearByIds = nearByDeliveryBoys.map(b => b._id);
            const busyIds = await DeliveryAssignment
                .find({ assignedTo: { $in: nearByIds }, status: { $nin: ["brodcasted", "completed"] } })
                .distinct("assignedTo");

            const busySet = new Set(busyIds.map(id => String(id)));
            availableBoys = nearByDeliveryBoys.filter(b => !busySet.has(String(b._id)));

            if (!availableBoys.length) {
                await order.save();
                return res.status(200).json({
                    message: "order status updated but no available delivery boys",
                    shopOrder
                });
            }

            const candidates = availableBoys.map(b => b._id);
            const deliveryAssignment = await DeliveryAssignment.create({
                order: order._id,
                shop: shopOrder.shop,
                shopOrderId: shopOrder._id,
                brodcastedTo: candidates,
                status: "brodcasted"
            });

            shopOrder.assignment = deliveryAssignment._id;

            await order.populate("shopOrders.shop", "name");

            const io = req.app.get("io");

            if (io) {
                for (const boy of availableBoys) {
                    if (!boy.socketId) continue;

                    io.to(boy.socketId).emit("newAssignment", {
                        sentTo: boy._id,
                        assignmentId: deliveryAssignment._id,
                        orderId: order._id,
                        shopName: shopOrder.shop.name,
                        deliveryAddress: order.deliveryAddress,
                        items: shopOrder.shopOrderItems,
                        subtotal: shopOrder.subtotal
                    });
                }
            }
        }

        await order.save();

        // REALTIME POPULATE
        await order.populate("user", "socketId");
        await order.populate("shopOrders.shop", "name");
        await order.populate("shopOrders.assignedDeliveryBoy", "fullName email mobile");

        const updatedShopOrder = order.shopOrders.find(
            o => String(o.shop._id) === String(shopId)
        );

        const io = req.app.get("io");

        if (io && order.user.socketId && updatedShopOrder) {
            io.to(order.user.socketId).emit("update-status", {
                orderId: order._id,
                shopId: updatedShopOrder.shop._id,
                status: updatedShopOrder.status,
                userId: order.user._id
            });
        }

        return res.status(200).json({
            shopOrder: updatedShopOrder,
            assignedDeliveryBoy: updatedShopOrder?.assignedDeliveryBoy,
            assignment: updatedShopOrder?.assignment,
            availableBoys
        });

    } catch (error) {
        console.error("Update order status error:", error);
        return res.status(500).json({ message: `order status error ${error}` });
    }
};

// ============================================================
//  DELIVERY BOY — PENDING ASSIGNMENTS
// ============================================================
export const getDeliveryBoyAssignment = async (req, res) => {
    try {
        const assignments = await DeliveryAssignment.find({
            brodcastedTo: req.userId,
            status: "brodcasted"
        })
            .populate("order")
            .populate("shop");

        const formatted = assignments.map(a => ({
            assignmentId: a._id,
            orderId: a.order._id,
            shopName: a.shop.name,
            deliveryAddress: a.order.deliveryAddress,
            items: a.order.shopOrders.find(so => so._id.equals(a.shopOrderId)).shopOrderItems,
            subtotal: a.order.shopOrders.find(so => so._id.equals(a.shopOrderId)).subtotal
        }));

        return res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: `get Assignment error ${error}` });
    }
};

// ============================================================
//  GET ORDER BY ID
// ============================================================
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate("user", "fullName email mobile location")
            .populate({
                path: "shopOrders.shop",
                model: "Shop",
            })
            .populate({
                path: "shopOrders.assignedDeliveryBoy",
                model: "User",
                select: "fullName mobile location",
            })
            .populate({
                path: "shopOrders.shopOrderItems.item",
                model: "Item",
            })
            .lean();

        if (!order) {
            return res.status(404).json({ message: "order not found" });
        }

        return res.status(200).json(order);
    } catch (error) {
        console.error("getOrderById error:", error);
        return res.status(500).json({ message: `get by id order error ${error.message}` });
    }
};

// ============================================================
//  DELIVERY BOY — ACCEPT ORDER
// ============================================================
export const acceptOrder = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignment = await DeliveryAssignment.findById(assignmentId);
        if (!assignment) {
            return res.status(400).json({ message: "assignment not found" });
        }

        if (assignment.status !== "brodcasted") {
            return res.status(400).json({ message: "assignment is expired" });
        }

        const alreadyAssigned = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: { $nin: ["brodcasted", "completed"] }
        });

        if (alreadyAssigned) {
            return res.status(400).json({ message: "You already have an ongoing order" });
        }

        assignment.assignedTo = req.userId;
        assignment.status = "assigned";
        assignment.acceptedAt = new Date();
        await assignment.save();

        const order = await Order.findById(assignment.order);
        const shopOrder = order.shopOrders.id(assignment.shopOrderId);
        shopOrder.assignedDeliveryBoy = req.userId;
        await order.save();

        return res.status(200).json({ message: "Order accepted" });
    } catch (error) {
        return res.status(500).json({ message: `accept order error ${error}` });
    }
};

// ============================================================
//  DELIVERY BOY — CURRENT ORDER
// ============================================================
export const getCurrentOrder = async (req, res) => {
    try {
        const assignment = await DeliveryAssignment.findOne({
            assignedTo: req.userId,
            status: "assigned"
        })
            .populate("shop", "name")
            .populate("assignedTo", "fullName email mobile location")
            .populate({
                path: "order",
                populate: [{ path: "user", select: "fullName email location mobile" }]
            });

        // ✅ FIX IS HERE
        if (!assignment) {
            return res.status(200).json(null);
        }

        const shopOrder = assignment.order.shopOrders.find(
            so => String(so._id) === String(assignment.shopOrderId)
        );

        let deliveryBoyLocation = { lat: null, lon: null };
        if (
            assignment.assignedTo?.location?.coordinates?.length === 2
        ) {
            deliveryBoyLocation.lat =
                assignment.assignedTo.location.coordinates[1];
            deliveryBoyLocation.lon =
                assignment.assignedTo.location.coordinates[0];
        }

        let customerLocation = { lat: null, lon: null };
        if (assignment.order.deliveryAddress) {
            customerLocation.lat =
                assignment.order.deliveryAddress.latitude;
            customerLocation.lon =
                assignment.order.deliveryAddress.longitude;
        }

        return res.status(200).json({
            _id: assignment.order._id,
            user: assignment.order.user,
            shopOrder,
            deliveryAddress: assignment.order.deliveryAddress,
            deliveryBoyLocation,
            customerLocation
        });
    } catch (error) {
        console.error("getCurrentOrder error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};


// ============================================================
//  TODAY’S DELIVERY STATS
// ============================================================
export const getTodayDeliveries = async (req, res) => {
    try {
        const deliveryBoyId = req.userId;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const orders = await Order.find({
            "shopOrders.assignedDeliveryBoy": new mongoose.Types.ObjectId(deliveryBoyId),
            "shopOrders.status": "delivered",
            "shopOrders.deliveredAt": { $gte: startOfDay }
        }).lean();

        let stats = {};

        orders.forEach(order => {
            order.shopOrders.forEach(so => {
                if (
                    String(so.assignedDeliveryBoy) === String(deliveryBoyId) &&
                    so.status === "delivered" &&
                    so.deliveredAt &&
                    so.deliveredAt >= startOfDay
                ) {
                    const hour = new Date(so.deliveredAt).getHours();
                    stats[hour] = (stats[hour] || 0) + 1;
                }
            });
        });

        const formatted = Object.keys(stats)
            .map(hour => ({
                hour: Number(hour),
                count: stats[hour]
            }))
            .sort((a, b) => a.hour - b.hour);

        return res.status(200).json(formatted);
    } catch (error) {
        return res.status(500).json({ message: `today deliveries error ${error}` });
    }
};

// ============================================================
//  CANCEL ORDER (USER)
// ============================================================
export const cancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId;

        const order = await Order.findById(orderId)
            .populate("shopOrders.owner", "socketId")
            .populate("user", "socketId");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (String(order.user._id) !== String(userId)) {
            return res.status(403).json({ message: "Not authorized to cancel this order" });
        }

        const deliveredExists = order.shopOrders.some(so => so.status === "delivered");
        if (deliveredExists) {
            return res.status(400).json({ message: "Delivered orders cannot be cancelled" });
        }

        order.shopOrders.forEach(so => {
            if (so.status !== "delivered") so.status = "cancelled";
        });

        await order.save();

        const io = req.app.get("io");
        if (io) {
            order.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner?.socketId;
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit("update-status", {
                        orderId: order._id,
                        shopId: shopOrder.shop,
                        status: "cancelled",
                        userId
                    });
                }
            });
        }

        return res.status(200).json({ message: "Order cancelled successfully" });
    } catch (error) {
        return res.status(500).json({ message: `cancel order error ${error}` });
    }
};















