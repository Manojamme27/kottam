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
router.put("/toggle-status", isAuth, toggleShopStatus);

// GLOBAL SEARCH (NO CITY)
router.get("/search-shops", searchShops);

// NEARBY (ONLY FOR TAGGING / BADGE)
router.get("/nearby", isAuth, getNearbyShops);

// ✅ GLOBAL SHOPS + ITEMS (MAIN SOURCE)
router.get("/all", isAuth, getAllShops);

export default router;
