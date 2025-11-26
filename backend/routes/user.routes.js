import express from "express"
import { getCurrentUser, updateUserLocation } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"
import Shop from "../models/shop.model.js"
import Item from "../models/item.model.js"
import User from "../models/user.model.js"


const userRouter = express.Router()


userRouter.get("/current",isAuth, getCurrentUser)
userRouter.post('/update-location',isAuth,updateUserLocation)
userRouter.get("/location-refresh", isAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const city = user.currentCity;

        if (!city) return res.status(400).json({ message: "No saved city" });

        // get only open shops
        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") },
            isOpen: true
        });

        const shopIds = shops.map(s => s._id);

        const items = await Item.find({ shop: { $in: shopIds } })
            .populate("shop", "name image isOpen");

        return res.status(200).json({ shops, items });

    } catch (error) {
        return res.status(500).json({ message: "refresh failed", error });
    }
});
export const updateUserLocation = async (req, res) => {
    try {
        const userId = req.userId;
        const { city, state, address } = req.body;

        if (!city) {
            return res.status(400).json({ message: "City is required" });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                currentCity: city,
                currentState: state,
                currentAddress: address,
            },
            { new: true }
        );

        return res.status(200).json({
            message: "Location updated",
            user: updatedUser
        });

    } catch (error) {
        console.log("Update location error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};



export default userRouter
