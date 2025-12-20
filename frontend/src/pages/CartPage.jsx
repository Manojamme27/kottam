import React, { useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import CartItemCard from '../components/CartItemCard';
import { toast } from "react-toastify";

function CartPage() {

    const navigate = useNavigate();
    const { cartItems, totalAmount } = useSelector(state => state.user);

    // 🔥 Popup state
    const [showMinOrderPopup, setShowMinOrderPopup] = useState(false);

    return (
        <div className='min-h-screen bg-[#fff9f6] flex justify-center p-6'>
            <div className='w-full max-w-[800px]'>

                <div className='flex items-center gap-5 mb-6 '>
                    <div className='z-10' onClick={() => navigate("/")}>
                        <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
                    </div>
                    <h1 className='text-2xl font-bold text-start'>Your Cart</h1>
                </div>

               {cartItems?.length === 0 ? (
    <div className="flex justify-center mt-10 px-4 animate-fadeIn">
        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl shadow-xl rounded-3xl p-8 border border-orange-100 animate-slideUp">

            {/* Illustration Circle */}
            <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-orange-100 to-orange-200
                            shadow-inner flex items-center justify-center mb-6 animate-float">

                <div className="animate-softGlow">
                    <svg width="70" height="70" viewBox="0 0 24 24" fill="none">
                        <path d="M7 10h14l-1.5 9h-15L3 4H1"
                              stroke="#ff7b34"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"/>
                        <circle cx="10" cy="21" r="1.3" fill="#ff7b34"/>
                        <circle cx="18" cy="21" r="1.3" fill="#ff7b34"/>
                    </svg>
                </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2 tracking-tight">
                Your Cart is Empty
            </h2>

            {/* Subtitle */}
            <p className="text-gray-500 text-center text-sm leading-relaxed mb-7">
                Looks like you haven't added anything yet.
            </p>

            {/* Button */}
            <button
                onClick={() => navigate("/")}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 
                           text-white font-semibold text-lg rounded-xl shadow-md hover:shadow-lg 
                           transition active:scale-95"
            >
                Browse Items
            </button>

        </div>
    </div>
) : (


                    <>
                        <div className='space-y-4'>
                            {cartItems.map((item, index) => (
                                <CartItemCard data={item} key={index} />
                            ))}
                        </div>

                        <div className='mt-6 bg-white p-4 rounded-xl shadow flex justify-between items-center border'>
                            <h1 className='text-lg font-semibold'>Total Amount</h1>
                            <span className='text-xl font-bold text-[#ff4d2d]'>₹{totalAmount}</span>
                        </div>

                        <div className='mt-4 flex justify-end'>
                            <button
                                onClick={() => {
    if (!cartItems || cartItems.length === 0) return;

    // 🔒 BLOCK MULTI-SHOP ORDERS
    const uniqueShopIds = [
        ...new Set(cartItems.map(item => item.shop))
    ];

    if (uniqueShopIds.length > 1) {
        toast.error("You can order items from only one shop at a time");
        return;
    }

    // 🔒 MINIMUM ORDER CHECK
    if (totalAmount < 100) {
        toast.error("Minimum order amount is ₹100");
        setShowMinOrderPopup(true);
        return;
    }

    navigate("/checkout");
}}

                                className="bg-[#ff4d2d] text-white py-3 rounded-xl font-semibold w-full hover:bg-[#e64526] transition"
                            >
                                Proceed to Checkout
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* 🔥 Minimum Order Popup */}
            {showMinOrderPopup && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white w-[85%] max-w-sm p-6 rounded-xl shadow-xl text-center">
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Minimum Order Required
                        </h2>
                        <p className="text-gray-600 mb-5">
                            Your order must be at least <span className="font-bold text-[#ff4d2d]">₹100</span>.
                        </p>
                        <button
                            onClick={() => setShowMinOrderPopup(false)}
                            className="bg-[#ff4d2d] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#e64526] transition"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

        </div>
    )
}

export default CartPage;




