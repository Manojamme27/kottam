import React, { useState, memo } from "react";
import {
    FaLeaf,
    FaDrumstickBite,
    FaStar,
    FaRegStar,
    FaMinus,
    FaPlus,
    FaShoppingCart,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../redux/userSlice";
import { getImageUrl } from "../utils/getImageUrl";

function FoodCard({ data }) {
    const [quantity, setQuantity] = useState(0);
    const [added, setAdded] = useState(false);
    const dispatch = useDispatch();
    const { cartItems } = useSelector((state) => state.user);

    // ⭐ ALWAYS return only shopId
    const getShopId = (shop) => {
        if (!shop) return null;
        if (typeof shop === "string") return shop;
        if (shop._id) return shop._id;
        return null;
    };

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                i <= rating ? (
                    <FaStar key={i} className="text-yellow-500 text-sm sm:text-base" />
                ) : (
                    <FaRegStar key={i} className="text-yellow-500 text-sm sm:text-base" />
                )
            );
        }
        return stars;
    };

    const handleIncrease = () => setQuantity((prev) => prev + 1);
    const handleDecrease = () => {
        if (quantity > 0) setQuantity((prev) => prev - 1);
    };

    // ⭐ FIXED: shop is now guaranteed to be ONLY shopId, not an object
    const handleAddToCart = () => {
        if (quantity > 0) {
            dispatch(
                addToCart({
                    id: data._id,
                    name: data.name,
                    price: data.offerPrice || data.price,
                    image: data.image,
                    shop: data.shop?._id || data.shop,  // forces string
                    quantity,
                    foodType: data.foodType,
                })
            );

            setAdded(true);
            setTimeout(() => setAdded(false), 500);
        }
    };

    const imageUrl = getImageUrl(data.image);

    const discount =
        data.offerPrice && data.price
            ? Math.round(((data.price - data.offerPrice) / data.price) * 100)
            : 0;

    return (
        <div className="w-[150px] sm:w-[170px] md:w-[180px] rounded-2xl border border-[#ff4d2d]/60 bg-white shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
            {/* 🖼 Image Section */}
            <div className="relative w-full h-[120px] sm:h-[130px] flex justify-center items-center bg-white">
                <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                    {data.foodType?.toLowerCase() === "veg" ? (
                        <FaLeaf className="text-green-600 text-lg" />
                    ) : data.foodType?.toLowerCase() === "non veg" ? (
                        <FaDrumstickBite className="text-red-600 text-lg" />
                    ) : null}
                </div>

                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={data.name}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-gray-50">
                        No Image
                    </div>
                )}

                {discount > 0 && (
                    <div className="absolute bottom-2 left-2 bg-[#ff4d2d] text-white text-xs font-semibold px-2 py-0.5 rounded">
                        {discount}% OFF
                    </div>
                )}
            </div>

            {/* 📝 Info Section */}
            <div className="flex-1 flex flex-col p-3">
                <h1 className="text-[#1a1a1a] font-semibold text-sm sm:text-base md:text-lg capitalize truncate leading-tight">
                    {data.name}
                </h1>

                {data.description && (
                    <p className="text-gray-500 text-[11px] sm:text-xs mt-1 line-clamp-2 leading-snug tracking-wide h-8">
                        {data.description}
                    </p>
                )}

                <div className="flex items-center gap-1 mt-1">
                    {renderStars(data.rating?.average || 0)}
                    <span className="text-xs text-gray-500">
                        {data.rating?.count || 0}
                    </span>
                </div>
            </div>

            {/* 💰 Price + Cart */}
            <div className="flex items-center justify-between p-3 mt-auto h-[60px]">
                <div>
                    {data.offerPrice > 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-[#ff4d2d] font-bold text-sm sm:text-lg">
                                ₹{data.offerPrice}
                            </span>
                            <span className="line-through text-gray-400 text-xs sm:text-sm">
                                ₹{data.price}
                            </span>
                        </div>
                    ) : (
                        <span className="font-bold text-gray-900 text-sm sm:text-lg">
                            ₹{data.price}
                        </span>
                    )}
                </div>

                {/* Cart Controls */}
                <div className="flex items-center border rounded-full overflow-hidden shadow-sm">
                    <button
                        className="px-2 py-1 hover:bg-gray-100 transition"
                        onClick={handleDecrease}
                    >
                        <FaMinus size={10} />
                    </button>
                    <span className="text-sm px-1">{quantity}</span>
                    <button
                        className="px-2 py-1 hover:bg-gray-100 transition"
                        onClick={handleIncrease}
                    >
                        <FaPlus size={10} />
                    </button>

                    <motion.button
                        whileTap={{ scale: 1.2 }}
                        animate={
                            added
                                ? { scale: [1, 1.3, 1], boxShadow: "0 0 10px #ff4d2d" }
                                : {}
                        }
                        transition={{ duration: 0.3 }}
                        className={`${cartItems.some((i) => i.id === data._id)
                            ? "bg-gray-800"
                            : "bg-[#ff4d2d]"
                            } text-white px-2 sm:px-3 py-2 transition-colors`}
                        onClick={handleAddToCart}
                    >
                        <FaShoppingCart size={14} />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

export default memo(FoodCard);
