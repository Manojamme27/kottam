import axios from "axios";
import React, { useEffect, useState } from "react";
import { serverUrl } from "../App";
import { useNavigate, useParams } from "react-router-dom";
import { FaStore, FaUtensils, FaArrowLeft } from "react-icons/fa";
import { FaLocationDot } from "react-icons/fa6";
import { toast } from "react-toastify";
import ItemModal from "../components/ItemModal";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, updateQuantity } from "../redux/userSlice";
import ShopBannerSlider from "../components/ShopBannerSlider";


import { getImageUrl } from "../utils/getImageUrl";
import FloatingCartBar from "../components/FloatingCartBar";

function Shop() {
    const { shopId } = useParams();
    const [items, setItems] = useState([]);
    const [shop, setShop] = useState(null);
    const [modalItem, setModalItem] = useState(null);
    const dispatch = useDispatch();
    const { cartItems } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const [currentShopIndex, setCurrentShopIndex] = useState(0);


    // ⭐ ALWAYS always return string shopId
    const getShopId = (shop) => {
        if (!shop) return null;
        if (typeof shop === "string") return shop;
        if (typeof shop === "object" && shop._id) return shop._id;
        return null;
    };

    const handleShop = async () => {
        try {
            const result = await axios.get(
                `${serverUrl}/api/item/get-by-shop/${shopId}`,
                { withCredentials: true }
            );

            setShop(result.data.shop);
            setItems(result.data.items);
        } catch (error) {
            console.log(error);
            toast.error("Failed to load shop details");
        }
    };

    useEffect(() => {
        handleShop();
    }, [shopId]);

    const getItemQuantity = (id) => {
        const found = cartItems.find((i) => i.id === id);
        return found ? found.quantity : 0;
    };
    useEffect(() => {
        if (!shop?.images || shop.images.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentShopIndex((prev) =>
                prev === shop.images.length - 1 ? 0 : prev + 1
            );
        }, 3000); // 3 seconds auto slide

        return () => clearInterval(interval);
    }, [shop]);


    // ⭐ FIXED add to cart (clean shopId always)
    const handleAddToCart = (item) => {
        dispatch(
            addToCart({
                id: item._id,
                name: item.name,
                price: item.offerPrice || item.price,
                image: item.images?.[0] || "",
                shop: item.shop?._id || item.shop,   // ensures string
                quantity: 1,
                foodType: item.foodType
            })
        );

        toast.success(`${item.name} added to cart`);
    };

    // ⭐ FIXED update quantity (clean shopId always)
    const handleUpdateQuantity = (item, newQty) => {
        if (newQty < 0) newQty = 0;

        dispatch(
            updateQuantity({
                id: item._id,
                quantity: newQty,
                shop: getShopId(item.shop),  // ⭐ FIX
            })
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 relative pb-24">
            {/* Back button */}
            <button
                className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white px-3 py-2 rounded-full shadow-md transition"
                onClick={() => navigate("/")}
            >
                <FaArrowLeft />
                <span>Back</span>
            </button>

            {/* Shop Banner */}
            {shop && (
                <div className="relative w-full h-64 md:h-80 lg:h-96">
                    {(() => {
                        const imgs = shop.images?.length
                            ? shop.images
                            : shop.image
                                ? [shop.image]
                                : [];

                        return (
                            <div className="relative w-full h-full overflow-hidden">
                                {/* Slider Track */}
                                <div
                                    className="flex h-full w-full transition-all duration-500"
                                    style={{ transform: `translateX(-${currentShopIndex * 100}%)` }}
                                >
                                    {imgs.map((img, idx) => (
                                        <img
                                            key={idx}
                                            src={getImageUrl(img)}
                                            alt={shop.name}
                                            className="w-full h-full object-cover shrink-0"
                                        />
                                    ))}
                                </div>

                                {/* Dots */}
                                <div className="absolute bottom-3 w-full flex justify-center gap-2">
                                    {imgs.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-3 h-3 rounded-full cursor-pointer ${idx === currentShopIndex ? "bg-white" : "bg-white/40"
                                                }`}
                                            onClick={() => setCurrentShopIndex(idx)}
                                        />
                                    ))}
                                </div>

                                {/* Next / Prev buttons */}
                                {imgs.length > 1 && (
                                    <>
                                        <button
                                            onClick={() =>
                                                setCurrentShopIndex((i) =>
                                                    i === 0 ? imgs.length - 1 : i - 1
                                                )
                                            }
                                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                                        >
                                            ‹
                                        </button>

                                        <button
                                            onClick={() =>
                                                setCurrentShopIndex((i) =>
                                                    i === imgs.length - 1 ? 0 : i + 1
                                                )
                                            }
                                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full"
                                        >
                                            ›
                                        </button>
                                    </>
                                )}
                            </div>
                        );
                    })()}

                    <div className="absolute inset-0 bg-linear-to-b from-black/70 to-black/40 flex flex-col justify-center items-center text-center px-4">
                        <FaStore className="text-white text-4xl mb-3 drop-shadow-md" />
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg">
                            {shop.name}
                        </h1>
                        <div className="flex items-center gap-2.5 mt-1">
                            <FaLocationDot size={18} color="red" />
                            <p className="text-base md:text-lg font-medium text-gray-200">
                                {shop.address}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* MENU */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <h2 className="flex items-center justify-center gap-3 text-2xl sm:text-3xl font-bold mb-8 text-gray-800">
                    <FaUtensils color="red" /> Our Items
                </h2>

                {/* MOBILE VIEW */}
                <div className="block md:hidden">
                    {items.length > 0 ? (
                        items.map((item) => {
                            const quantity = getItemQuantity(item._id);

                            return (
                                <div
                                    key={item._id}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 mb-4 p-3 flex justify-between"
                                >
                                    <div className="flex-1 pr-3 flex flex-col justify-between">
                                        <div onClick={() => setModalItem(item)}>
                                            <h3 className="font-semibold text-gray-800 text-base">
                                                {item.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm leading-snug">
                                                {item.description}
                                            </p>

                                            <div className="flex items-center gap-2 mt-1">
                                                {item.offerPrice ? (
                                                    <>
                                                        <span className="text-[#ff4d2d] font-bold">
                                                            ₹{item.offerPrice}
                                                        </span>
                                                        <span className="line-through text-gray-400 text-sm">
                                                            ₹{item.price}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-[#ff4d2d] font-bold">
                                                        ₹{item.price}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center gap-2">
                                            {quantity > 0 ? (
                                                <div className="flex items-center justify-between border border-[#ff4d2d] rounded-full text-[#ff4d2d] text-sm font-semibold px-3 py-1 w-[85px]">
                                                    <button onClick={() => handleUpdateQuantity(item, quantity - 1)}>-</button>
                                                    <span>{quantity}</span>
                                                    <button onClick={() => handleUpdateQuantity(item, quantity + 1)}>+</button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="bg-[#ff4d2d] text-white font-semibold text-xs px-4 py-1 rounded-full shadow-md hover:bg-[#e64526] transition-all"
                                                    onClick={() => handleAddToCart(item)}
                                                >
                                                    ADD +
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className="relative w-[120px] h-[100px] rounded-xl overflow-hidden shrink-0"
                                        onClick={() => setModalItem(item)}
                                    >
                                        <img
                                            src={getImageUrl(item.images?.[0] || item.image)}
                                            alt={item.name}
                                            className="w-full h-full object-cover rounded-xl"
                                        />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 text-lg">No Items Available</p>
                    )}
                </div>

                {/* DESKTOP GRID */}
                <div
                    className="hidden md:grid gap-6"
                    style={{
                        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                    }}
                >
                    {items.length > 0 ? (
                        items.map((item) => {
                            const quantity = getItemQuantity(item._id);

                            return (
                                <div
                                    key={item._id}
                                    onClick={() => setModalItem(item)}
                                    className="cursor-pointer bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-transform duration-300"
                                >
                                    <img
                                        src={getImageUrl(item.images?.[0] || item.image)}
                                        alt={item.name}
                                        className="w-full h-40 object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="font-semibold text-gray-900 text-base">
                                            {item.name}
                                        </h3>
                                        <p className="text-gray-500 text-sm">{item.description}</p>

                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2">
                                                {item.offerPrice ? (
                                                    <>
                                                        <span className="text-[#ff4d2d] font-bold">
                                                            ₹{item.offerPrice}
                                                        </span>
                                                        <span className="line-through text-gray-400 text-sm">
                                                            ₹{item.price}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-[#ff4d2d] font-bold">
                                                        ₹{item.price}
                                                    </span>
                                                )}
                                            </div>

                                            {quantity > 0 ? (
                                                <div
                                                    className="flex items-center justify-between border border-[#ff4d2d] rounded-full text-[#ff4d2d] text-sm font-semibold px-3 py-1 w-[85px]"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button onClick={() => handleUpdateQuantity(item, quantity - 1)}>-</button>
                                                    <span>{quantity}</span>
                                                    <button onClick={() => handleUpdateQuantity(item, quantity + 1)}>+</button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="bg-[#ff4d2d] text-white font-semibold text-xs px-4 py-1 rounded-full shadow-md hover:bg-[#e64526] transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddToCart(item);
                                                    }}
                                                >
                                                    ADD +
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 text-lg">No Items Available</p>
                    )}
                </div>
            </div>

            {/* ITEM MODAL */}
            {modalItem && <ItemModal item={modalItem} onClose={() => setModalItem(null)} />}

            {/* FLOATING CART BAR */}
            <FloatingCartBar />
        </div>
    );
}

export default Shop;

