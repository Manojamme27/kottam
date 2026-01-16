import Shop from "../models/shop.model.js";
import cloudinary from "cloudinary";
import mongoose from "mongoose";


// Cloudinary Config (already done globally)
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload buffer to Cloudinary
const uploadBufferToCloudinary = (fileBuffer, fileName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.v2.uploader.upload_stream(
            { folder: "shops", public_id: fileName },
            (error, result) => {
                if (error) return reject(error);
                resolve(result.secure_url);
            }
        );
        stream.end(fileBuffer);
    });
};

// CREATE OR EDIT SHOP
export const createEditShop = async (req, res) => {
    try {
        const { name, city, state, address, existingImages, latitude, longitude } = req.body;
        if (!latitude || !longitude) {
            return res.status(400).json({
                message: "Shop location (latitude & longitude) is required",
            });
        }

        // Parse old images
        let oldImages = [];
        try {
            oldImages = existingImages ? JSON.parse(existingImages) : [];
        } catch (e) {
            oldImages = [];
        }

        const newImages = [];

        // Upload new buffers to Cloudinary
        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                const imageUrl = await uploadBufferToCloudinary(
                    file.buffer,
                    Date.now() + "-" + file.originalname
                );
                if (imageUrl) newImages.push(imageUrl);
            }
        }

        // Merge final images
        const finalImages = [...oldImages, ...newImages];

        // Find existing shop
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

    // ✅ GEO LOCATION
    location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
    },
});

        } else {
shop.name = name;
shop.city = city;
shop.state = state;
shop.address = address;
shop.images = finalImages;
shop.image = finalImages[0] || shop.image;

// ✅ UPDATE LOCATION
shop.location = {
    type: "Point",
    coordinates: [Number(longitude), Number(latitude)],
};

await shop.save();

        }

        shop = await shop.populate("owner items");
        return res.status(200).json(shop);

    } catch (error) {
        console.error("Shop Create/Edit Error:", error);
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
        return res.status(500).json({ message: `get my shop error ${error}` });
    }
};

export const toggleShopStatus = async (req, res) => {
  try {
    const ownerId = req.userId;

    if (!ownerId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const shop = await Shop.findOne({ owner: ownerId });

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found for this owner",
      });
    }

    const newStatus = !shop.isOpen;

    await Shop.updateOne(
      { _id: shop._id },
      { $set: { isOpen: newStatus } }
    );

    return res.status(200).json({
      message: `Shop is now ${newStatus ? "OPEN" : "CLOSED"}`,
      isOpen: newStatus,
    });

  } catch (error) {
    console.error("toggleShopStatus error:", error);
    return res.status(500).json({
      message: error.message,
    });
  }
};


export const searchShops = async (req, res) => {
  try {
    const { query } = req.query;

if (!query) {
  return res.status(400).json({ message: "query required" });
}


    const shops = await Shop.find({
      name: { $regex: query, $options: "i" },
      isOpen: { $ne: false },
    }).select("name image images _id");

    res.status(200).json(shops);
  } catch (error) {
    console.error("searchShops error:", error);
    res.status(500).json({ message: "Failed to search shops" });
  }
};

export const getNearbyShops = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude & Longitude required" });
    }

    const shops = await Shop.find({
      isOpen: { $ne: false },
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: 25000, // ✅ 25 KM
        },
      },
    }).populate("items");

    return res.status(200).json(shops);
  } catch (error) {
    console.error("Nearby shops error:", error);
    res.status(500).json({ message: "Failed to fetch nearby shops" });
  }
};
export const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find({ isOpen: { $ne: false } })
      .populate({
        path: "items",
        populate: {
          path: "shop",
          select: "name",
        },
      });

    return res.status(200).json(shops);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch all shops",
    });
  }
};

















