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
        const { latitude, longitude } = req.body;


       if (latitude == null || longitude == null) {

    return res.status(200).json({ message: "Location skipped (no coordinates)" });
}

const user = await User.findByIdAndUpdate(
    req.userId,
    {
        location: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
        }
    },
    { new: true }
);


        if (!user) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ message: "Location updated" });

    } catch (error) {
        return res.status(500).json({ message: `update location user error ${error}` });
    }
};



