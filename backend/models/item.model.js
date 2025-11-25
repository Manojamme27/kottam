import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },

    // MULTIPLE images only
    images: {
        type: [String],
        default: []
    },

    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
        required: true
    },

    category: {
        type: String,
        enum: [
            "All", "Grocery", "Fruits & Vegetables", "Dairy Bread & Eggs",
            "Chicken, Meat & Fish", "Baby Care", "Agriculture Tools",
            "Personal Care", "Beauty Store", "Stationary",
            "Cold Drinks & Juices", "Pizza & Burger", "Organic & Health",
            "Cleaning Essentials", "Atta Dal & Rice",
            "Tea Coffee & Health Drinks",
        ],
        required: true
    },

    price: { type: Number, required: true, min: 0 },
    offerPrice: { type: Number, default: 0 },
    description: { type: String, default: "" },

    foodType: {
        type: String,
        enum: ["veg", "non veg", "none"],
        required: true
    },

    rating: {
        average: { type: Number, default: 0 },
        count: { type: Number, default: 0 }
    }

}, { timestamps: true });

const Item = mongoose.model("Item", itemSchema);
export default Item;
