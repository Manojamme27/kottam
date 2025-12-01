import React from "react";

export default function CategoryCardCircle({ name, image, onClick, isSelected }) {
    return (
        <div
            onClick={onClick}
            className="flex flex-col items-center justify-start cursor-pointer transition-all duration-200"
        >
            {/* Image Circle */}
            <div
                className={`
                    relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24
                    rounded-full overflow-hidden border border-transparent
                    transition-all duration-200
                    hover:shadow-[0_0_12px_rgba(255,93,0,0.25)]
                    ${isSelected ? "shadow-[0_0_15px_rgba(255,93,0,0.35)]" : ""}
                `}
            >
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover rounded-full"
                />
            </div>

            {/* CATEGORY NAME — Auto sliding text */}
            <div
                className="
                    mt-2 text-xs sm:text-sm font-medium text-gray-800 
                    w-20 md:w-24 text-center overflow-hidden whitespace-nowrap relative
                "
            >
                <span className="inline-block animate-scrollText px-1">
                    {name}
                </span>
            </div>

            {/* Orange underline */}
            {isSelected && (
                <div className="w-10 h-[3px] bg-[#FF5D00] rounded-full mt-1"></div>
            )}
        </div>
    );
}
