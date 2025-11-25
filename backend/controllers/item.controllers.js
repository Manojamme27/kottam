import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js"; // ✅ ADD THIS

// ✅ ADD ITEM – upload images to Cloudinary
export const addItem = async (req, res) => {
    try {
        const { name, category, foodType, price, offerPrice, description } = req.body;

        if (!name || !category || !price) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const shop = await Shop.findOne({ owner: req.userId });
        if (!shop) return res.status(400).json({ message: "Shop not found" });

        // ✅ Upload all images to Cloudinary
        const imageUrls = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const imageUrl = await uploadOnCloudinary(file.path);
                if (imageUrl) imageUrls.push(imageUrl);
            }
        }

        const newItem = await Item.create({
            name,
            category,
            foodType,
            price,
            offerPrice,
            description,
            images: imageUrls,                  // ✅ store all
            image: imageUrls[0] || "",          // ✅ main image for old UI
            shop: shop._id,
        });

        shop.items.push(newItem._id);
        await shop.save();

        const updatedShop = await Shop.findById(shop._id).populate("items");
        return res.status(200).json(updatedShop);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: `Add Item error: ${error}` });
    }
};


// ✅ EDIT ITEM – keep selected old images + upload new to Cloudinary
export const editItem = async (req, res) => {
    try {
        const { itemId } = req.params;

        let item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ message: "Item not found" });

        const {
            name,
            category,
            foodType,
            price,
            offerPrice,
            description,
            existingImages // JSON string from frontend
        } = req.body;

        // ✅ Safely parse existingImages
        let oldImages = [];
        try {
            oldImages = existingImages ? JSON.parse(existingImages) : [];
        } catch (e) {
            oldImages = [];
        }

        // ✅ Upload newly added images to Cloudinary
        const newImages = [];
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const imageUrl = await uploadOnCloudinary(file.path);
                if (imageUrl) newImages.push(imageUrl);
            }
        }

        // ✅ Final images list
        const finalImages = [...oldImages, ...newImages];

        item.name = name;
        item.category = category;
        item.foodType = foodType;
        item.price = price;
        item.offerPrice = offerPrice;
        item.description = description;
        item.images = finalImages;
        item.image = finalImages[0] || item.image; // ✅ keep main image in sync

        await item.save();

        const shop = await Shop.findOne({ owner: req.userId }).populate("items");
        return res.status(200).json(shop);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: `Edit Item error: ${error}` });
    }
};


// ✅ Get item by id
export const getItemById = async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(400).json({ message: "item not found" });
        }
        return res.status(200).json(item);
    } catch (error) {
        return res.status(500).json({ message: `get item error ${error}` });
    }
};


// ✅ Delete item
export const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const item = await Item.findByIdAndDelete(itemId);
        if (!item) {
            return res.status(400).json({ message: "item not found" });
        }
        const shop = await Shop.findOne({ owner: req.userId });
        shop.items = shop.items.filter((i) => i.toString() !== item._id.toString());
        await shop.save();
        await shop.populate({
            path: "items",
            options: { sort: { updatedAt: -1 } },
        });
        return res.status(200).json(shop);
    } catch (error) {
        return res.status(500).json({ message: `delete item error ${error}` });
    }
};


// ✅ Get items by city (only OPEN shops)
export const getItemByCity = async (req, res) => {
    try {
        const { city } = req.params;
        if (!city) {
            return res.status(400).json({ message: "city is required" });
        }

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") },
        }).populate("items");

        if (!shops) {
            return res.status(400).json({ message: "shops not found" });
        }

        const openShops = shops.filter(s => s.isOpen !== false);
        if (openShops.length === 0) {
            return res.status(200).json([]);
        }

        const shopIds = openShops.map(shop => shop._id);

        const items = await Item.find({ shop: { $in: shopIds } })
            .populate("shop", "name image isOpen");

        const filtered = items.filter(i => i.shop?.isOpen);
        return res.status(200).json(filtered);

    } catch (error) {
        return res.status(500).json({ message: `get item by city error ${error}` });
    }
};


// ✅ Get items for a specific shop
export const getItemsByShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const shop = await Shop.findById(shopId).populate({
            path: "items",
            populate: { path: "shop", select: "name image" }
        });

        if (!shop) {
            return res.status(400).json("shop not found");
        }
        return res.status(200).json({
            shop,
            items: shop.items,
        });
    } catch (error) {
        return res.status(500).json({ message: `get item by shop error ${error}` });
    }
};


// ✅ Search items (only OPEN shops)
export const searchItems = async (req, res) => {
    try {
        const { query, city } = req.query;
        if (!query || !city) {
            return res.status(200).json([]);
        }

        const shops = await Shop.find({
            city: { $regex: new RegExp(`^${city}$`, "i") },
            isOpen: true
        });

        if (!shops.length) {
            return res.status(200).json([]);
        }

        const shopIds = shops.map(s => s._id);

        const items = await Item.find({
            shop: { $in: shopIds },
            $or: [
                { name: { $regex: query, $options: "i" } },
                { category: { $regex: query, $options: "i" } }
            ]
        }).populate("shop", "name image isOpen");

        const filtered = items.filter(i => i.shop?.isOpen === true);

        return res.status(200).json(filtered);

    } catch (error) {
        return res.status(500).json({ message: `search item error ${error}` });
    }
};


// ✅ Item rating
export const rating = async (req, res) => {
    try {
        const { itemId, rating } = req.body;

        if (!itemId || !rating) {
            return res.status(400).json({ message: "itemId and rating is required" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "rating must be between 1 to 5" });
        }

        const item = await Item.findById(itemId);
        if (!item) {
            return res.status(400).json({ message: "item not found" });
        }

        const newCount = item.rating.count + 1;
        const newAverage =
            (item.rating.average * item.rating.count + rating) / newCount;

        item.rating.count = newCount;
        item.rating.average = newAverage;
        await item.save();
        return res.status(200).json({ rating: item.rating });
    } catch (error) {
        return res.status(500).json({ message: `rating error ${error}` });
    }
};
