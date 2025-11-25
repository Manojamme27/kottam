import React from "react";
import { motion } from "framer-motion";

const bannerImages = [
    "https://res.cloudinary.com/demo/image/upload/v1699473756/banner1.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1699473756/banner2.jpg",
    "https://res.cloudinary.com/demo/image/upload/v1699473756/banner3.jpg",
];

function SlidingBanner() {
    return (
        <div className="w-full flex justify-center mt-3">
            <div className="w-full max-w-6xl overflow-hidden rounded-2xl shadow-md">
                <motion.div
                    className="flex"
                    animate={{ x: ["0%", "-100%"] }}
                    transition={{
                        repeat: Infinity,
                        duration: 20,
                        ease: "linear",
                    }}
                >
                    {[...bannerImages, ...bannerImages].map((src, idx) => (
                        <img
                            key={idx}
                            src={src}
                            alt={`banner-${idx}`}
                            className="w-full h-[180px] sm:h-[200px] md:h-[250px] object-cover shrink-0"
                        />
                    ))}
                </motion.div>
            </div>
        </div>
    );
}

export default SlidingBanner;
