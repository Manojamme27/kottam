import express from "express"

import isAuth from "../middlewares/isAuth.js"
import { addItem, deleteItem, editItem, getItemByCity, getItemById, getItemsByShop, rating, searchItems } from "../controllers/item.controllers.js"
import { upload } from "../middlewares/multer.js"



const itemRouter=express.Router()

itemRouter.post("/add-item", isAuth, upload.array("images"),addItem)
itemRouter.post("/edit-item/:itemId", isAuth, upload.array("newImages"),editItem)
itemRouter.get("/get-by-id/:itemId",isAuth,getItemById)
itemRouter.get("/delete/:itemId",isAuth,deleteItem)
itemRouter.get("/get-by-city/:city",isAuth,getItemByCity)
itemRouter.get("/get-by-shop/:shopId",isAuth,getItemsByShop)
itemRouter.get("/search-items",isAuth,searchItems)
itemRouter.post("/rating",isAuth,rating)
// PUBLIC – no auth
router.get("/public/get-by-city/:city", async (req, res) => {
  try {
    const { city } = req.params;

    const shops = await Shop.find({
      city: { $regex: new RegExp(`^${city}$`, "i") },
      isOpen: true,
    }).select("_id");

    const shopIds = shops.map(s => s._id);

    const items = await Item.find({ shop: { $in: shopIds } })
      .populate("shop", "name image isOpen");

    return res.status(200).json(items);
  } catch (error) {
    return res.status(500).json({ message: "Failed to load items" });
  }
});


export default itemRouter
