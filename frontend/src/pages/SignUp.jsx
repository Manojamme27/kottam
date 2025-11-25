import React, { useState } from "react";
import axios from "axios";
import { serverUrl } from "../App";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function SignUp() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        mobile: "",
        role: "user",
    });

    const [loading, setLoading] = useState(false);
    const [showAdminPopup, setShowAdminPopup] = useState(false);
    const [adminCode, setAdminCode] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleSelect = (role) => {
        setFormData({ ...formData, role });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const result = await axios.post(`${serverUrl}/api/auth/signup`, formData, {
                withCredentials: true,
            });

            if (result.status === 202) {
                setShowAdminPopup(true);
                setSuccess(result.data.message);
            } else if (result.status === 201) {
                dispatch(setUserData(result.data));
                setSuccess("Account created successfully!");
                setTimeout(() => navigate("/"), 500);
            }
        } catch (error) {
            setError(error.response?.data?.message || "Signup failed. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAdminCode = async () => {
        if (!adminCode) return setError("Enter the admin code.");
        setError("");
        setLoading(true);

        try {
            const result = await axios.post(
                `${serverUrl}/api/auth/signup`,
                { ...formData, adminCode },
                { withCredentials: true }
            );

            if (result.status === 201) {
                dispatch(setUserData(result.data));
                setSuccess("✅ Signup successful!");
                setShowAdminPopup(false);
                setTimeout(() => navigate("/"), 500);
            }
        } catch (error) {
            setError(error.response?.data?.message || "Invalid code. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-[#fff9f6] px-4">
            <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-[#ff4d2d] mb-6">
                    Sign Up
                </h2>

                {error && <p className="text-red-600 text-sm text-center mb-3">{error}</p>}
                {success && <p className="text-green-600 text-sm text-center mb-3">{success}</p>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-[#ff4d2d]"
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-[#ff4d2d]"
                        onChange={handleChange}
                        required
                    />

                    {/* 👁️ Password Input */}
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            placeholder="Password"
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full outline-none focus:border-[#ff4d2d]"
                            onChange={handleChange}
                            required
                        />
                        <div
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-[#ff4d2d]"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </div>
                    </div>

                    <input
                        type="text"
                        name="mobile"
                        placeholder="Mobile Number"
                        className="border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-[#ff4d2d]"
                        onChange={handleChange}
                        required
                    />

                    {/* ✅ Modern Role Selection */}
                    <div className="flex justify-between mt-2">
                        {["user", "owner", "deliveryBoy"].map((role) => (
                            <button
                                type="button"
                                key={role}
                                onClick={() => handleRoleSelect(role)}
                                className={`flex-1 mx-1 py-2 rounded-lg font-semibold text-sm transition-all duration-200 border 
                  ${formData.role === role
                                        ? "bg-[#ff4d2d] text-white border-[#ff4d2d]"
                                        : "bg-white text-gray-700 border-gray-300 hover:border-[#ff4d2d]"
                                    }`}
                            >
                                {role === "deliveryBoy" ? "Delivery Boy" : role.charAt(0).toUpperCase() + role.slice(1)}
                            </button>
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-2 bg-[#ff4d2d] hover:bg-[#e64526] text-white font-semibold py-2 rounded-lg transition-all duration-200"
                    >
                        {loading ? "Please wait..." : "Sign Up"}
                    </button>
                </form>

                <p className="text-sm text-gray-600 text-center mt-4">
                    Already have an account?{" "}
                    <span
                        onClick={() => navigate("/signin")}
                        className="text-[#ff4d2d] cursor-pointer font-semibold"
                    >
                        Sign In
                    </span>
                </p>
            </div>

            {/* ✅ Admin Verification Popup */}
            {showAdminPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-2xl w-[90%] max-w-sm text-center">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Admin Approval Required
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter the admin verification code shared with you.
                        </p>
                        <input
                            type="text"
                            placeholder="Enter 6-digit code"
                            className="border border-gray-300 rounded-lg px-3 py-2 w-full mb-4 outline-none focus:border-[#ff4d2d]"
                            value={adminCode}
                            onChange={(e) => setAdminCode(e.target.value)}
                        />
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={handleVerifyAdminCode}
                                disabled={loading}
                                className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg font-medium"
                            >
                                {loading ? "Verifying..." : "Verify"}
                            </button>
                            <button
                                onClick={() => setShowAdminPopup(false)}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SignUp;
