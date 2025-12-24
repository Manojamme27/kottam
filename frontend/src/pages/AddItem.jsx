import React, { useState, useRef } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { FaUtensils, FaPlus, FaTimes } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";

function AddItem() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { myShopData } = useSelector((state) => state.owner); // still here if you need later

    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(0);
    const [offerPrice, setOfferPrice] = useState(0);

    // 👇 multiple images state
    const [newImages, setNewImages] = useState([]); // [{file, preview}]
    const fileInputRef = useRef(null);

    const [category, setCategory] = useState("");
    const [foodType, setFoodType] = useState("veg");

    const categories = [
        "All",
        "Grocery",
        "Fruits & Vegetables",
        "Dairy Bread & Eggs",
        "Chicken, Meat & Fish",
        "Baby Care",
        "Agriculture Tools",
        "Personal Care",
        "Beauty Store",
        "Stationary",
        "Cold Drinks & Juices",
        "Pizza & Burger",
        "Organic & Health",
        "Cleaning Essentials",
        "Atta Dal & Rice",
        "Tea Coffee & Health Drinks",
        "Clothing",
        "FastFood",
        "Restaurant",
        "Bakery",
    ];

    // 🔹 Handle selecting multiple images
    const handleImages = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const mapped = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setNewImages((prev) => [...prev, ...mapped]);

        // clear input so user can pick again
        e.target.value = "";
    };

    // 🔹 Remove one selected image
    const handleRemoveNewImage = (index) => {
        setNewImages((prev) => {
            const copy = [...prev];
            const removed = copy.splice(index, 1);
            if (removed[0]?.preview) {
                URL.revokeObjectURL(removed[0].preview);
            }
            return copy;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("description", description);
            formData.append("category", category);
            formData.append("foodType", foodType);
            formData.append("price", price);
            formData.append("offerPrice", offerPrice);

            // ⭐ append multiple images
            newImages.forEach((img) => {
                formData.append("images", img.file);
            });

            const result = await axios.post(
                `${serverUrl}/api/item/add-item`,
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            dispatch(setMyShopData(result.data));
            toast.success("Item added successfully! 🎉", { position: "top-center" });
            setLoading(false);
            navigate("/");
        } catch (error) {
            console.error("Error adding item:", error);
            toast.error("Failed to add item. Try again!", {
                position: "top-center",
            });
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#fff9f6] relative p-6">
            <button
                onClick={() => navigate("/")}
                className="absolute top-6 left-6 text-[#ff4d2d] hover:text-orange-700 transition"
            >
                <IoIosArrowRoundBack size={36} />
            </button>

            <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 border border-orange-100">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-orange-100 p-4 rounded-full mb-4">
                        <FaUtensils className="text-[#ff4d2d] w-14 h-14" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Add Item</h1>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter item name"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]"
                            onChange={(e) => setName(e.target.value)}
                            value={name}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            placeholder="Enter item description..."
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d] resize-none"
                            rows={3}
                            onChange={(e) => setDescription(e.target.value)}
                            value={description}
                        ></textarea>
                    </div>

                    {/* Images */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Images (3–5 images recommended)
                        </label>

                        {/* Hidden file input */}
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleImages}
                        />

                        {/* Thumbnails row with + card */}
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {newImages.map((img, index) => (
                                <div
                                    key={index}
                                    className="relative w-24 h-24 rounded-lg overflow-hidden border shadow-sm shrink-0"
                                >
                                    <img
                                        src={img.preview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveNewImage(index)}
                                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 shadow-md"
                                    >
                                        <FaTimes size={10} />
                                    </button>

                                </div>
                            ))}

                            {/* + Add Image card */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 text-xs shrink-0 hover:border-[#ff4d2d] hover:text-[#ff4d2d] transition"
                            >
                                <FaPlus className="mb-1" />
                                Add Image
                            </button>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Original Price
                            </label>
                            <input
                                type="number"
                                placeholder="₹0"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]"
                                onChange={(e) => setPrice(e.target.value)}
                                value={price}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Offer Price
                            </label>
                            <input
                                type="number"
                                placeholder="₹0"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]"
                                onChange={(e) => setOfferPrice(e.target.value)}
                                value={offerPrice}
                            />
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Category
                        </label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]"
                            onChange={(e) => setCategory(e.target.value)}
                            value={category}
                        >
                            <option value="">Select Category</option>
                            {categories.map((cate, index) => (
                                <option key={index} value={cate}>
                                    {cate}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Item Type
                        </label>
                        <select
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4d2d]"
                            onChange={(e) => setFoodType(e.target.value)}
                            value={foodType}
                        >
                            <option value="veg">Veg</option>
                            <option value="non veg">Non-Veg</option>
                            <option value="none">None</option>
                        </select>
                    </div>

                    {/* Save */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#ff4d2d] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-[#e64526] transition-all duration-200"
                    >
                        {loading ? <ClipLoader size={20} color="white" /> : "Save"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default AddItem;




