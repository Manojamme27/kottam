import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaMinus, FaPlus } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/userSlice";
import { getImageUrl } from "../utils/getImageUrl";

export default function ItemModal({ item, onClose }) {
    const [qty, setQty] = useState(1);
    const dispatch = useDispatch();
    const modalRef = useRef();
    const [currentIndex, setCurrentIndex] = useState(0);


    if (!item) return null;

    const price = item.offerPrice && item.offerPrice > 0 ? item.offerPrice : item.price;

    const handleAdd = () => {
        dispatch(
            addToCart({
                id: item._id,
                name: item.name,
                price,
                image: item.images?.[0] || item.image,
                shop: item.shop?._id || item.shop,
                quantity: qty,
                foodType: item.foodType,
            })
        );
        onClose();
    };

    // Close on background click
    const handleBackgroundClick = (e) => {
        if (modalRef.current && !modalRef.current.contains(e.target)) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-999 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onMouseDown={handleBackgroundClick}
        >
            <AnimatePresence>
                <motion.div
                    ref={modalRef}
                    initial={{ y: 250, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 300, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 12 }}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragEnd={(e, info) => {
                        if (info.offset.y > 120) onClose();
                    }}
                    className="w-full max-w-2xl bg-[#0f0f10] rounded-3xl shadow-[0_0_40px_rgba(255,0,100,0.3)] border border-[#ff005d40] overflow-hidden neon-card relative"
                >
                    {/* HERO IMAGE */}
                    {/* HERO IMAGE / SLIDER */}
                    <div className="relative h-64 md:h-80 w-full overflow-hidden">

                        {/* decide images array */}
                        {(() => {
                            const imgs = item.images?.length
                                ? item.images
                                : item.image
                                    ? [item.image]
                                    : [];

                            return (
                                <>
                                    {/* Slide Container */}
                                    <motion.div
                                        className="flex h-full w-full"
                                        animate={{ x: -currentIndex * 100 + "%" }}
                                        transition={{ type: "spring", stiffness: 120, damping: 15 }}
                                    >
                                        {imgs.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={getImageUrl(img)}
                                                className="w-full h-full object-cover shrink-0 rounded-b-3xl"
                                            />
                                        ))}
                                    </motion.div>

                                    {/* Dots */}
                                    <div className="absolute bottom-3 w-full flex justify-center gap-2">
                                        {imgs.map((_, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setCurrentIndex(idx)}
                                                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition 
                                ${currentIndex === idx ? "bg-white" : "bg-white/40"}`}
                                            />
                                        ))}
                                    </div>

                                    {/* Next/Prev Buttons */}
                                    {imgs.length > 1 && (
                                        <>
                                            <button
                                                onClick={() =>
                                                    setCurrentIndex((i) => (i === 0 ? imgs.length - 1 : i - 1))
                                                }
                                                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                                            >
                                                ‹
                                            </button>

                                            <button
                                                onClick={() =>
                                                    setCurrentIndex((i) => (i === imgs.length - 1 ? 0 : i + 1))
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                                            >
                                                ›
                                            </button>
                                        </>
                                    )}
                                </>
                            );
                        })()}

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 bg-black/60 border border-white/20 backdrop-blur-xl text-white p-2 rounded-full hover:bg-white/20 transition shadow-lg"
                        >
                            ✕
                        </button>
                    </div>


                    {/* CONTENT */}
                    <div className="p-6 text-white">
                        <h2 className="text-3xl font-bold tracking-wide text-[#ff2e78] drop-shadow-lg">
                            {item.name}
                        </h2>

                        {item.description && (
                            <p className="text-gray-300 mt-2 text-sm leading-relaxed">
                                {item.description}
                            </p>
                        )}

                        {/* PRICE SECTION */}
                        <div className="mt-5 flex items-center gap-4">
                            <div className="text-3xl font-extrabold text-[#ff2e78]">
                                ₹{price}
                            </div>

                            {item.offerPrice > 0 && (
                                <>
                                    <div className="line-through text-gray-500 text-lg">
                                        ₹{item.price}
                                    </div>

                                    <span className="text-green-400 font-semibold bg-green-900/30 px-3 py-1 rounded-full text-sm">
                                        {Math.round(
                                            ((item.price - item.offerPrice) / item.price) * 100
                                        )}
                                        % OFF
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    {/* BOTTOM BAR */}
                    <div className="p-4 border-t border-[#ffffff15] bg-[#141417] flex items-center justify-between">
                        {/* Quantity */}
                        <motion.div
                            whileTap={{ scale: 1.1 }}
                            className="flex items-center gap-3 bg-[#1d1d21] border border-[#ffffff15] rounded-full px-4 py-2 shadow-inner"
                        >
                            <button
                                onClick={() => setQty((q) => Math.max(1, q - 1))}
                                className="text-white hover:text-[#ff2e78] transition"
                            >
                                <FaMinus />
                            </button>
                            <span className="text-white text-lg font-bold w-6 text-center">
                                {qty}
                            </span>
                            <button
                                onClick={() => setQty((q) => q + 1)}
                                className="text-white hover:text-[#ff2e78] transition"
                            >
                                <FaPlus />
                            </button>
                        </motion.div>

                        {/* ADD BUTTON */}
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: "0 0 20px #ff2e78" }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleAdd}
                            className="px-8 py-3 text-white font-semibold rounded-full 
                                       bg-linear-to-r from-[#ff007a] to-[#ff4d2d] 
                                       shadow-[0_0_15px_#ff2e7870] tracking-wide uppercase"
                        >
                            Add • ₹{price * qty}
                        </motion.button>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
