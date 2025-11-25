import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

// CREATE OR EDIT SHOP WITH MULTIPLE IMAGES
export const createEditShop = async (req, res) => {
    try {
        const { name, city, state, address, existingImages } = req.body;

        let oldImages = [];
        try {
            oldImages = existingImages ? JSON.parse(existingImages) : [];
        } catch (e) {
            oldImages = [];
        }

        const newImages = [];

        // Upload new files
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const imageUrl = await uploadOnCloudinary(file.path);
                if (imageUrl) newImages.push(imageUrl);
            }
        }

        const finalImages = [...oldImages, ...newImages];

        let shop = await Shop.findOne({ owner: req.userId });

        if (!shop) {
            shop = await Shop.create({
                name,
                city,
                state,
                address,
                images: finalImages,
                image: finalImages[0] || "",
                owner: req.userId,
            });
        } else {
            shop.name = name;
            shop.city = city;
            shop.state = state;
            shop.address = address;
            shop.images = finalImages;
            shop.image = finalImages[0] || shop.image;

            await shop.save();
        }

        shop = await shop.populate("owner items");

        return res.status(200).json(shop);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};


export const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ owner: req.userId })
            .populate("owner")
            .populate({
                path: "items",
                options: { sort: { updatedAt: -1 } },
            });

        if (!shop) return res.status(200).json(null);

        return res.status(200).json(shop);

    } catch (error) {
        return res
            .status(500)
            .json({ message: `get my shop error ${error}` });
    }
};

export const getShopByCity = async (req, res) => {
    try {
        const { city } = req.params;

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") },
        }).populate("items");

        if (!shops) {
            return res.status(400).json({ message: "shops not found" });
        }

        return res.status(200).json(shops);

    } catch (error) {
        return res.status(500).json({
            message: `get shop by city error ${error.message}`,
        });
    }
};

// Toggle shop status
export const toggleShopStatus = async (req, res) => {
    try {
        const ownerId = req.userId;

        const shop = await Shop.findOne({ owner: ownerId });
        if (!shop) {
            return res.status(404).json({ message: "Shop not found" });
        }

        shop.isOpen = !shop.isOpen;
        await shop.save();

        return res.json({
            success: true,
            isOpen: shop.isOpen,
            message: `Shop is now ${shop.isOpen ? "OPEN" : "CLOSED"}`,
        });

    } catch (error) {
        console.log("toggle error:", error);
        return res.status(500).json({
            message: "Failed to toggle shop status",
        });
    }
};
