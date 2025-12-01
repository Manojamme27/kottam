import React, { useRef, useEffect, useState } from "react";

export default function CategoryCardCircle({ name, image, onClick, isSelected }) {
    const textRef = useRef(null);
    const containerRef = useRef(null);
    const [shouldScroll, setShouldScroll] = useState(false);

    // Detect long text
    useEffect(() => {
        if (textRef.current && containerRef.current) {
            const isOverflowing =
                textRef.current.scrollWidth > containerRef.current.clientWidth;
            setShouldScroll(isOverflowing);
        }
    }, [name]);

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

            {/* CATEGORY NAME with Fade + Auto Scroll */}
            <div
                ref={containerRef}
                className="
                    relative mt-2 text-xs sm:text-sm font-medium text-gray-800
                    w-20 md:w-24 overflow-hidden whitespace-nowrap text-center
                "
            >
                {/* fade left */}
                <div className="absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-[#fff9f6] to-transparent pointer-events-none"></div>

                {/* TEXT */}
                <span
                    ref={textRef}
                    className={`inline-block px-1 ${
                        shouldScroll ? "animate-premiumScroll" : ""
                    }`}
                >
                    {name}
                </span>

                {/* fade right */}
                <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-[#fff9f6] to-transparent pointer-events-none"></div>
            </div>

            {/* Orange underline */}
            {isSelected && (
                <div className="w-10 h-[3px] bg-[#FF5D00] rounded-full mt-1"></div>
            )}
        </div>
    );
}
