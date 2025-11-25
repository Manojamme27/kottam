import Order from "../models/order.model.js";

export const getOwnerStats = async (req, res) => {
    try {
        const ownerId = req.userId;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);

        const orders = await Order.find({
            "shopOrders.owner": ownerId
        }).lean();

        let stats = {
            todayOrders: 0,
            weekOrders: 0,
            totalOrders: 0
        };

        orders.forEach(order => {
            order.shopOrders.forEach(shopOrder => {

                if (String(shopOrder.owner) !== String(ownerId)) return;

                // Count all shopOrders from this owner
                stats.totalOrders++;

                // Use deliveredAt, not createdAt
                const deliveredAt = shopOrder.deliveredAt
                    ? new Date(shopOrder.deliveredAt)
                    : null;

                if (deliveredAt) {
                    if (deliveredAt >= startOfDay) stats.todayOrders++;
                    if (deliveredAt >= startOfWeek) stats.weekOrders++;
                }
            });
        });

        return res.status(200).json(stats);

    } catch (error) {
        return res.status(500).json({
            message: `owner stats error: ${error}`
        });
    }
};
