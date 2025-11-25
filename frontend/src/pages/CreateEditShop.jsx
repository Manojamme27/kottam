import React, { useState, useRef, useEffect } from "react";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaUtensils, FaPlus, FaTimes } from "react-icons/fa";
import axios from "axios";
import { serverUrl } from "../App";
import { setMyShopData } from "../redux/ownerSlice";
import { ClipLoader } from "react-spinners";

function CreateEditShop() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { myShopData } = useSelector((state) => state.owner);
    const { currentCity, currentState, currentAddress } = useSelector(
        (state) => state.user
    );

    const [name, setName] = useState(myShopData?.name || "");
    const [address, setAddress] = useState(myShopData?.address || currentAddress);
    const [city, setCity] = useState(myShopData?.city || currentCity);
    const [state, setState] = useState(myShopData?.state || currentState);

    // MULTIPLE IMAGE STATE
    const [existingImages, setExistingImages] = useState(() => {
        if (myShopData?.images?.length > 0) return myShopData.images;
        if (myShopData?.image) return [myShopData.image]; // fallback for old shops
        return [];
    });

    const [newImages, setNewImages] = useState([]); // [{file, preview}]

    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);

    // Handle selecting new images
    const handleImages = (e) => {
        const files = Array.from(e.target.files || []);
        const mapped = files.map((file) => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setNewImages((prev) => [...prev, ...mapped]);
        e.target.value = "";
    };

    // Delete existing image
    const removeExisting = (idx) => {
        setExistingImages((prev) => prev.filter((_, i) => i !== idx));
    };

    // Delete new image
    const removeNewImage = (idx) => {
        setNewImages((prev) => {
            const copy = [...prev];
            URL.revokeObjectURL(copy[idx].preview);
            copy.splice(idx, 1);
            return copy;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("city", city);
            formData.append("state", state);
            formData.append("address", address);

            // Keep old images
            formData.append("existingImages", JSON.stringify(existingImages));

            // Attach new files
            newImages.forEach((img) => {
                formData.append("images", img.file);
            });

            const result = await axios.post(
                `${serverUrl}/api/shop/create-edit`,
                formData,
                {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            dispatch(setMyShopData(result.data));
            navigate("/");
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Server error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center flex-col items-center p-6 bg-linear-to-br from-orange-50 to-white min-h-screen relative">
            <div
                className="absolute top-5 left-5 z-10 cursor-pointer"
                onClick={() => navigate("/")}
            >
                <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
            </div>

            <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 border border-orange-100">
                <div className="flex flex-col items-center mb-6">
                    <div className="bg-orange-100 p-4 rounded-full mb-4">
                        <FaUtensils className="text-[#ff4d2d] w-16 h-16" />
                    </div>
                    <div className="text-3xl font-extrabold text-gray-900">
                        {myShopData ? "Edit Shop" : "Add Shop"}
                    </div>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Shop Name"
                            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    {/* MULTIPLE IMAGE PICKER */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Shop Images (Slides)
                        </label>

                        {/* Existing Images */}
                        {existingImages.length > 0 && (
                            <>
                                <p className="text-xs text-gray-500 mb-1">Existing</p>
                                <div className="flex gap-3 overflow-x-auto pb-2 mb-3">
                                    {existingImages.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="relative w-24 h-24 rounded-lg overflow-hidden border shadow-sm"
                                        >
                                            <img
                                                src={img}
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExisting(idx)}
                                                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 shadow-md"

                                            >
                                                <FaTimes size={10} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Hidden Input */}
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleImages}
                        />

                        {/* New Images + Add Button */}
                        <p className="text-xs text-gray-500 mb-1">New Images</p>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {newImages.map((img, idx) => (
                                <div
                                    key={idx}
                                    className="relative w-24 h-24 rounded-lg overflow-hidden border shadow-sm"
                                >
                                    <img
                                        src={img.preview}
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeNewImage(idx)}
                                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 shadow-md"

                                    >
                                        <FaTimes size={10} />
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-[#ff4d2d] hover:text-[#ff4d2d]"
                            >
                                <FaPlus className="mb-1" />
                                Add
                            </button>
                        </div>
                    </div>

                    {/* City + State */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                City
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                State
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                                value={state}
                                onChange={(e) => setState(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <input
                            type="text"
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#ff4d2d] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-orange-600 transition-all duration-200"
                    >
                        {loading ? <ClipLoader size={20} color="white" /> : "Save"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default CreateEditShop;
