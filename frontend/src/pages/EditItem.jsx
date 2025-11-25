import React, { useState, useEffect, useRef } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { FaUtensils, FaPlus, FaTimes } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";
import { ClipLoader } from "react-spinners";

function EditItem() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { itemId } = useParams();

    const [loading, setLoading] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(0);
    const [offerPrice, setOfferPrice] = useState(0);
    const [category, setCategory] = useState("");
    const [foodType, setFoodType] = useState("veg");

    // 🔹 images
    const [existingImages, setExistingImages] = useState([]); // URLs from DB
    const [newImages, setNewImages] = useState([]); // [{file, preview}]
    const fileInputRef = useRef(null);

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
    ];

    // ✅ Fetch item details
    useEffect(() => {
        const fetchItem = async () => {
            try {
                const result = await axios.get(
                    `${serverUrl}/api/item/get-by-id/${itemId}`,
                    {
                        withCredentials: true,
                    }
                );
                const item = result.data;
                setCurrentItem(item);
                setName(item.name || "");
                setDescription(item.description || "");
                setPrice(item.price || 0);
                setOfferPrice(item.offerPrice || 0);
                setCategory(item.category || "");
                setFoodType(item.foodType || "veg");

                // item.images is array of URLs
                setExistingImages(Array.isArray(item.images) ? item.images : []);
            } catch (error) {
                console.error("Error fetching item:", error);
            }
        };
        fetchItem();
    }, [itemId]);

    // 🔹 user picks new images
    const handleImages = (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const mapped = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));

        setNewImages((prev) => [...prev, ...mapped]);
        e.target.value = "";
    };

    // 🔹 delete one existing image (url)
    const handleRemoveExistingImage = (index) => {
        setExistingImages((prev) => prev.filter((_, i) => i !== index));
    };

    // 🔹 delete one new image
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

    // ✅ Submit changes
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

            // Keep only these existing image URLs
            formData.append("existingImages", JSON.stringify(existingImages));

            // attach new files
            // attach new uploaded files (MUST MATCH BACKEND)
            newImages.forEach((img) => {
                formData.append("newImages", img.file);
            });


            const result = await axios.post(
                `${serverUrl}/api/item/edit-item/${itemId}`,
                formData,
                {
                    withCredentials: true,
                }
            );

            dispatch(setMyShopData(result.data));
            setLoading(false);
            navigate("/");
        } catch (error) {
            console.error("Edit error:", error);
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#fff9f6] relative p-6">
            {/* Back Button */}
            <button
                onClick={() => navigate("/")}
                className="absolute top-6 left-6 text-[#ff4d2d] hover:text-orange-700 transition"
            >
                <IoIosArrowRoundBack size={36} />
            </button>

            {/* Edit Form Card */}
            <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 border border-orange-100">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-orange-100 p-4 rounded-full mb-4">
                        <FaUtensils className="text-[#ff4d2d] w-14 h-14" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Edit Item</h1>
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
                            Item Images (you can have multiple)
                        </label>

                        {/* Existing images */}
                        {existingImages.length > 0 && (
                            <>
                                <p className="text-xs text-gray-500 mb-1">Existing Images</p>
                                <div className="flex gap-3 overflow-x-auto pb-2 mb-3">
                                    {existingImages.map((img, index) => (
                                        <div
                                            key={index}
                                            className="relative w-24 h-24 rounded-lg overflow-hidden border shadow-sm shrink-0"
                                        >
                                            <img
                                                src={img}
                                                alt="Existing"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveExistingImage(index)}
                                                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 shadow-md"
                                            >
                                                <FaTimes size={10} />
                                            </button>

                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Hidden file input */}
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleImages}
                        />

                        {/* New Images + +card */}
                        <p className="text-xs text-gray-500 mb-1">
                            New Images (not yet saved)
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {newImages.map((img, index) => (
                                <div
                                    key={index}
                                    className="relative w-24 h-24 rounded-lg overflow-hidden border shadow-sm shrink-0"
                                >
                                    <img
                                        src={img.preview}
                                        alt="New"
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

                    {/* Price Fields */}
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

                    {/* Item Type */}
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

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#ff4d2d] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-[#e64526] transition-all duration-200"
                    >
                        {loading ? <ClipLoader size={20} color="white" /> : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default EditItem;
