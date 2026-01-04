import User from "../models/user.model.js";

export const getCurrentUser = async (req, res) => {
  try {
    // 🔥 THIS IS THE ONLY SOURCE OF TRUTH
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // ✅ ALWAYS return 200 if token is valid
    return res.status(200).json(user);

  } catch (error) {
    console.error("getCurrentUser error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
// ⭐ FINAL PATCH — FULLY COMPATIBLE WITH YOUR FRONTEND
export const updateUserLocation = async (req, res) => {
    try {
        const { lat, lon } = req.body;

        if (!lat || !lon) {
            return res.status(200).json({ message: "Location skipped (no coordinates)" });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                location: {
                    type: "Point",
                    coordinates: [Number(lon), Number(lat)],
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


