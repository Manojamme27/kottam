import express from "express";
import {
  createEditShop,
  getMyShop,
  getAllShops,
  toggleShopStatus,
  searchShops,
  getNearbyShops
} from "../controllers/shop.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

// CREATE / EDIT SHOP
router.post("/create-edit", isAuth, upload.array("images"), createEditShop);

// GET LOGGED-IN OWNER SHOP
router.get("/get-my", isAuth, getMyShop);

// ❌ DISABLED – city based filtering breaks global view
// router.get("/get-by-city/:city", isAuth, getShopByCity);

// TOGGLE SHOP STATUS
router.put("/toggle-status",  toggleShopStatus);

// GLOBAL SEARCH (NO CITY)
router.get("/search-shops", searchShops);

// NEARBY (ONLY FOR TAGGING / BADGE)
router.get("/nearby",  getNearbyShops);

// ✅ GLOBAL SHOPS + ITEMS (MAIN SOURCE)
router.get("/all", getAllShops);
// PUBLIC – for homepage / incognito
router.get("/public/get-by-city/:city", async (req, res) => {
  try {
    const { city } = req.params;

    const shops = await Shop.find({
      city: { $regex: new RegExp(`^${city}$`, "i") },
      isOpen: true,
    });

    return res.status(200).json(shops);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load shops" });
  }
});


export default router;





