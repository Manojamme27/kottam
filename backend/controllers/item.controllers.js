import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js";
import cloudinary from "cloudinary";

// Cloudinary Config
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload buffer to Cloudinary
const uploadBufferToCloudinary = (fileBuffer, fileName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
            { folder: "items", public_id: fileName },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(fileBuffer);
    });
};

/* ============================================================
   ADD ITEM
============================================================ */
export const addItem = async (req, res) => {
    try {
        const { name, category, foodType, price, offerPrice, description } = req.body;

        if (!name || !category || !price) {
            return res.status(400).json({ message: "Required fields missing" });
        }

        const shop = await Shop.findOne({ owner: req.userId });
        if (!shop) return res.status(400).json({ message: "Shop not found" });

        // Upload multiple images from buffer
        const imageUrls = [];

        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const url = await uploadBufferToCloudinary(
                    file.buffer,
                    Date.now() + "-" + file.originalname
                );
                if (url) imageUrls.push(url);
            }
        }

        const newItem = await Item.create({
            name,
            category,
            foodType,
            price,
            offerPrice,
            description,
            images: imageUrls,
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

/* ============================================================
   EDIT ITEM
============================================================ */
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
            existingImages
        } = req.body;

        const oldImages = existingImages ? JSON.parse(existingImages) : [];

        const newImages = [];

        // Upload images from buffer
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const url = await uploadBufferToCloudinary(
                    file.buffer,
                    Date.now() + "-" + file.originalname
                );
                if (url) newImages.push(url);
            }
        }

        const finalImages = [...oldImages, ...newImages];

        item.name = name;
        item.category = category;
        item.foodType = foodType;
        item.price = price;
        item.offerPrice = offerPrice;
        item.description = description;
        item.images = finalImages;

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


export const searchItems = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "query required" });
    }

    const items = await Item.find({
      name: { $regex: query, $options: "i" },
      isAvailable: { $ne: false },
    }).populate("shop", "name isOpen");

    res.status(200).json(items);
  } catch (error) {
    console.error("searchItems error:", error);
    res.status(500).json({ message: "Failed to search items" });
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


