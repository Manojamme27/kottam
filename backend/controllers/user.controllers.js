import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(400).json({ message: "userId is not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "user is not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: `get current user error ${error}` });
    }
};

// ⭐ FINAL PATCH — FULLY COMPATIBLE WITH YOUR FRONTEND
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
                currentState: state || null,
                currentAddress: address || null
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            message: "Location updated",
            user: updatedUser
        });
    } catch (error) {
        return res.status(500).json({ message: `update location user error ${error}` });
    }
};
