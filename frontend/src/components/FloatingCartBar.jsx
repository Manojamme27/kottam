import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaShoppingCart } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

function FloatingCartBar() {
    const navigate = useNavigate();
    const { cartItems, totalAmount } = useSelector((state) => state.user);

    const itemCount = cartItems.length;

    // If cart is empty -> don't render anything
    if (itemCount === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                key="floating-cart-bar"
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 80, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="
          fixed bottom-4 left-1/2 -translate-x-1/2
          bg-[#ff4d2d] text-white font-semibold
          flex items-center justify-between
          px-5 py-3 w-[92%] max-w-md
          rounded-full shadow-2xl cursor-pointer
          z-50
        "
                onClick={() => navigate("/cart")}
            >
                {/* Left side: cart icon + items */}
                <motion.div
                    className="flex items-center gap-3"
                    // small pulse when items change
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.3 }}
                >
                    <FaShoppingCart size={18} />
                    <span className="text-sm sm:text-base">
                        {itemCount} {itemCount === 1 ? "Item" : "Items"}
                    </span>
                </motion.div>

                {/* Right side: total amount + CTA */}
                <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">₹{totalAmount}</span>
                    <span className="text-xs sm:text-sm bg-white/20 px-2 py-1 rounded-full">
                        View Cart
                    </span>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

export default FloatingCartBar;
