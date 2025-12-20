import express from "express";
import { createEditShop, getMyShop, getShopByCity } from "../controllers/shop.controllers.js";
import isAuth from "../middlewares/isAuth.js";
import { upload } from "../middlewares/multer.js";
import { toggleShopStatus } from "../controllers/shop.controllers.js";
import { searchShops } from "../controllers/shop.controllers.js";







const router = express.Router();

// ⭐ MULTIPLE IMAGES → use `upload.array("images")`
router.post("/create-edit", isAuth, upload.array("images"), createEditShop);

// GET MY SHOP
router.get("/get-my", isAuth, getMyShop);

// GET SHOPS BY CITY
router.get("/get-by-city/:city", isAuth, getShopByCity);

// TOGGLE SHOP OPEN/CLOSE
router.put("/toggle-status", isAuth, toggleShopStatus);
router.get("/search-shops",  searchShops);




export default router;


