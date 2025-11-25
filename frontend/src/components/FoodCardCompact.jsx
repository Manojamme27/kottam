import React from "react";
import { FaLeaf, FaDrumstickBite } from "react-icons/fa";
import { getImageUrl } from "../utils/getImageUrl";

export default function FoodCardCompact({ data, onClick }) {
    const price =
        data?.offerPrice && data.offerPrice > 0 ? data.offerPrice : data.price;

    const discount =
        data?.offerPrice && data.price
            ? Math.round(((data.price - data.offerPrice) / data.price) * 100)
            : 0;

    // ⭐ FIX: Use images[0] → fallback to data.image
    const imageSrc = getImageUrl(data.images?.[0] || data.image);

    return (
        <div
            onClick={() => onClick && onClick(data)}
            className="cursor-pointer w-full bg-white rounded-2xl border border-[#ff4d2d]/70 p-2.5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01]"
        >
            {/* 🖼 Image */}
            <div className="relative h-24 sm:h-28 rounded-lg overflow-hidden">
                <img
                    src={imageSrc}
                    alt={data.name}
                    className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                />

                {/* Veg / Non-Veg Icon */}
                <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                    {data.foodType === "veg" ? (
                        <FaLeaf className="text-green-600" />
                    ) : data.foodType === "non veg" ? (
                        <FaDrumstickBite className="text-red-600" />
                    ) : null}
                </div>

                {/* Discount Tag */}
                {discount > 0 && (
                    <div className="absolute bottom-2 left-2 bg-[#ff4d2d] text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded uppercase tracking-wider shadow-md">
                        {discount}% OFF
                    </div>
                )}
            </div>

            {/* 📝 Info */}
            <div className="mt-2">
                <div className="text-[#1a1a1a] text-sm sm:text-base font-semibold capitalize truncate leading-tight">
                    {data.name}
                </div>

                <div className="text-gray-500 text-[11px] sm:text-xs mt-1 tracking-wide truncate">
                    {data.shop?.name || "Shop"}
                </div>

                <div className="mt-2 flex items-center gap-2">
                    <div className="text-[#ff4d2d] font-semibold text-sm sm:text-base md:text-lg">
                        ₹{price}
                    </div>

                    {data.offerPrice && data.offerPrice > 0 && (
                        <div className="line-through text-[11px] sm:text-xs text-gray-400 font-medium">
                            ₹{data.price}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
