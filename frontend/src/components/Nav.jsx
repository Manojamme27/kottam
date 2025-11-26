import React, { useEffect, useRef, useState } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { FiShoppingCart } from "react-icons/fi";
import { FaBell } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { RxCross2 } from "react-icons/rx";
import axios from "axios";
import { serverUrl } from "../App";
import { setSearchItems, setUserData, setCurrentCity } from "../redux/userSlice";
import { TbReceipt2 } from "react-icons/tb";
import { MdAdd, MdAddCircleOutline } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo2.png";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { markAllRead } from "../redux/ownerSlice";

function Nav() {
    const { userData, currentCity, cartItems } = useSelector((state) => state.user);
    const { notifications } = useSelector((state) => state.owner);

    const [showInfo, setShowInfo] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showNotif, setShowNotif] = useState(false);
    const [query, setQuery] = useState("");
    const [showLocationPopup, setShowLocationPopup] = useState(false);
    const [manualCity, setManualCity] = useState("");
    const [scrolled, setScrolled] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);
    const mobileSearchRef = useRef(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // ⭐ Scroll Logic
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // ⭐ Logout
    const handleLogOut = async () => {
        try {
            await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true });
            dispatch(setUserData(null));
            toast.success("Logged out successfully 👋");
            navigate("/signin");
        } catch {
            toast.error("Failed to logout.");
        }
    };
    useEffect(() => {
        function handleOutsideClick(e) {
            if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) {
                setMobileSearchOpen(false);
                setQuery("");            // clear text
                dispatch(setSearchItems(null));  // clear results
            }
        }

        if (mobileSearchOpen) {
            document.addEventListener("mousedown", handleOutsideClick);
        }

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [mobileSearchOpen]);


    // ⭐ Delete account
    const handleDeleteAccount = async () => {
        try {
            const result = await axios.delete(`${serverUrl}/api/auth/delete-account`, {
                withCredentials: true,
            });

            if (result.status === 200) {
                dispatch(setUserData(null));
                setShowDeletePopup(false);
                toast.success("Account deleted");
                navigate("/signin");
            }
        } catch {
            toast.error("Failed to delete account.");
        }
    };

    // ⭐ Search Items
    const handleSearchItems = async () => {
        try {
            const result = await axios.get(
                `${serverUrl}/api/item/search-items?query=${query}&city=${currentCity}`,
                { withCredentials: true }
            );
            dispatch(setSearchItems(result.data));
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (query) handleSearchItems();
        else dispatch(setSearchItems(null));
    }, [query]);

    // ⭐ Close menus
    useEffect(() => {
        const closeMenus = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowInfo(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
        };
        document.addEventListener("mousedown", closeMenus);
        return () => document.removeEventListener("mousedown", closeMenus);
    }, []);

    // ⭐ Change City Manually
    const changeCity = () => {
        if (!manualCity.trim()) return toast.error("Enter a city name");
        dispatch(setCurrentCity(manualCity.trim()));
        setShowLocationPopup(false);
        toast.success(`Location changed to ${manualCity}`);
    };

    return (
        <>
            {/* NAVBAR */}
            <div
                className={`w-full h-20 flex items-center justify-between md:justify-center gap-[30px] px-5 fixed top-0 z-50 backdrop-blur-md border-b border-white/40 transition-all ${scrolled ? "bg-white/80 shadow-md" : "bg-white/50"
                    }`}
            >

                {/* Logo */}
                <div
                    className="flex items-center gap-3 cursor-pointer hover:scale-105 transition"
                    onClick={() => navigate("/")}
                >
                    <img src={logo} alt="" className="w-14 h-14 object-contain rounded-lg" />
                    <h1 className="text-2xl font-bold text-[#ff4d2d]">KOTTAM</h1>
                </div>
                {/* MOBILE LOCATION PILL */}
                


                {/* Search (Desktop) */}
                {userData.role === "user" && (
                    <div className="hidden md:flex w-[45%] bg-white/40 backdrop-blur-xl border border-white/30 rounded-full px-5 py-2 items-center gap-4">
                        <FaLocationDot size={22} className="text-[#ff4d2d]" />

                        <p
                            className="text-gray-700 font-semibold cursor-pointer whitespace-nowrap"
                            onClick={() => setShowLocationPopup(true)}
                        >
                            {currentCity || "Select Location"}
                        </p>

                        <span className="mx-2 text-gray-400">|</span>

                        <input
                            className="w-full bg-transparent outline-none"
                            placeholder="Search delicious food..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                )}

                {/* RIGHT SECTION */}
                <div className="flex items-center gap-4">
        



                    {/* Notifications */}
                    {userData.role === "owner" && (
                        <div className="relative" ref={notifRef}>
                            <FaBell
                                size={24}
                                className="text-[#ff4d2d] cursor-pointer"
                                onClick={() => {
                                    setShowNotif(!showNotif);
                                    dispatch(markAllRead());
                                }}
                            />

                            {notifications.some((n) => !n.read) && (
                                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    {notifications.filter((n) => !n.read).length}
                                </span>
                            )}

                            <AnimatePresence>
                                {showNotif && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute right-0 mt-3 bg-white w-72 rounded-xl shadow-xl p-4 z-50"
                                    >
                                        <h3 className="font-semibold mb-2">Notifications</h3>
                                        <div className="max-h-60 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <p className="text-gray-500 text-sm text-center py-4">
                                                    No notifications yet.
                                                </p>
                                            ) : (
                                                notifications.map((n, i) => (
                                                    <div key={i} className="p-3 border-b text-sm">
                                                        <p className="font-medium">{n.title}</p>
                                                        <p className="text-gray-600">{n.message}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* My Orders */}
                    {(userData.role === "user" || userData.role === "owner") && (
                        <button
                            onClick={() => navigate("/my-orders")}
                            className="hidden md:flex items-center gap-2 bg-[#ff4d2d] text-white px-4 py-2 rounded-lg shadow"
                        >
                            <TbReceipt2 size={18} /> My Orders
                        </button>
                    )}

                    {/* Add Item (Owner) */}
                    {userData.role === "owner" && (
                        <button
                            onClick={() => navigate("/add-item")}
                            className="hidden md:flex items-center gap-2 bg-[#ff4d2d] text-white px-4 py-2 rounded-lg shadow"
                        >
                            <MdAddCircleOutline size={18} /> Add Item
                        </button>
                    )}
                    {/* Mobile Search Icon */}
                    {userData.role === "user" && (
                        <IoIosSearch
                            size={26}
                            className="text-[#ff4d2d] cursor-pointer md:hidden"
                            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                        />
                    )}
                

                    {/* Cart */}
                    {userData.role === "user" && (
                        <div onClick={() => navigate("/cart")} className="relative cursor-pointer">
                            <FiShoppingCart size={25} className="text-[#ff4d2d]" />
                            <span className="absolute right-[-9px] -top-3 text-[#ff4d2d] font-semibold">
                                {cartItems.length}
                            </span>
                        </div>
                    )}

                    {/* Profile */}
                    <div ref={dropdownRef} className="relative">
                        <div
                            className="w-10 h-10 rounded-full bg-[#ff4d2d] text-white flex items-center justify-center cursor-pointer"
                            onClick={() => setShowInfo(!showInfo)}
                        >
                            {userData?.fullName?.slice(0, 1)}
                        </div>

                        {showInfo && (
                            <div className="absolute right-0 mt-3 bg-white shadow-xl rounded-xl p-5 w-48 z-50">
                                <div className="font-semibold mb-2">{userData.fullName}</div>
                                {/* Mobile My Orders */}
                                {(userData.role === "user" || userData.role === "owner") && (
                                    <div
                                        className="md:hidden text-red-700 cursor-pointer mb-3"
                                        onClick={() => navigate("/my-orders")}
                                    >
                                        My Orders
                                    </div>
                                )}


                                {userData.role === "user" && (
                                    <div
                                        className="text-red-600 cursor-pointer mb-2"
                                        onClick={() => setShowDeletePopup(true)}
                                    >
                                        Delete Account
                                    </div>
                                )}

                                <div className="text-[#ff4d2d] cursor-pointer" onClick={handleLogOut}>
                                    Log Out
                                </div>
                            </div>
                        )}
                    </div>
                    {/* MOBILE ONLY: Location bubble under profile */}
                    {userData.role === "user" && (
                        <div className="absolute top-[60px] right-1 md:hidden z-20">
                            <div
                                onClick={() => setShowLocationPopup(true)}
                                className="flex items-center gap-1 px-1 py-0 "
                            >
                                <FaLocationDot className="text-[#ff4d2d]" />
                                <span className="font-medium text-gray-700">
                                    {currentCity || "Location"}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* Mobile Search Bar Under Navbar */}
            {userData.role === "user" && mobileSearchOpen && (
                <div ref={mobileSearchRef} className="md:hidden w-full px-5 py-2 bg-white shadow-sm fixed top-20 z-40">
                    <div className="flex items-center bg-orange-50 border px-3 py-2 rounded-full">
                        <IoIosSearch className="text-[#ff4d2d] mr-2" size={22} />
                        <input
                            type="text"
                            className="w-full bg-transparent outline-none"
                            placeholder="Search delicious food..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>
            )}


            {/* 🌍 MOBILE SEARCH POPUP */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        className="fixed inset-0 bg-white z-999 p-5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-xl font-semibold">Search</h2>
                            <RxCross2
                                size={28}
                                onClick={() => setShowSearch(false)}
                                className="text-gray-700"
                            />
                        </div>

                        <div
                            className="flex items-center gap-2 bg-orange-50 p-3 rounded-xl mb-4"
                            onClick={() => setShowLocationPopup(true)}
                        >
                            <FaLocationDot className="text-[#ff4d2d]" />
                            <p className="font-semibold text-gray-800">
                                {currentCity || "Select Location"}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 bg-orange-50 p-3 rounded-xl">
                            <IoIosSearch className="text-[#ff4d2d]" size={22} />
                            <input
                                type="text"
                                placeholder="Search delicious food..."
                                className="bg-transparent w-full outline-none"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 🏙 LOCATION POPUP */}
            <AnimatePresence>
                {showLocationPopup && (
                    <motion.div
                        className="fixed inset-0 bg-black/40 flex items-center justify-center z-99999"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white p-6 rounded-2xl shadow-xl w-[90%] max-w-sm"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                        >
                            <h3 className="text-lg font-bold mb-3">Change Location</h3>

                            <input
                                className="border w-full px-3 py-2 rounded-lg mb-3"
                                placeholder="Enter city name"
                                value={manualCity}
                                onChange={(e) => setManualCity(e.target.value)}
                            />

                            <button
                                className="w-full bg-[#ff4d2d] text-white py-2 rounded-lg font-semibold"
                                onClick={changeCity}
                            >
                                Save
                            </button>

                            <button
                                className="w-full mt-3 text-gray-700 underline"
                                onClick={() => setShowLocationPopup(false)}
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* OWNER MOBILE FLOATING BUTTONS */}
            {userData.role === "owner" && (
                <div className="md:hidden fixed bottom-5 right-5 flex flex-col gap-3 z-50">
                    <button
                        onClick={() => navigate("/my-orders")}
                        className="bg-[#ff4d2d] text-white w-12 h-12 rounded-full shadow-lg hover:bg-[#e64526] flex items-center justify-center"
                    >
                        <TbReceipt2 size={22} />
                    </button>

                    <button
                        onClick={() => navigate("/add-item")}
                        className="bg-[#ff4d2d] text-white w-12 h-12 rounded-full shadow-lg hover:bg-[#e64526] flex items-center justify-center"
                    >
                        <MdAdd size={24} />
                    </button>
                </div>
            )}

        </>
        
    );
   

    
}

export default Nav;
