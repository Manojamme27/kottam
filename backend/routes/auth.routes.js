import express from "express";
import {
    googleAuth,
    resetPassword,
    sendOtp,
    signIn,
    signOut,
    signUp,
    verifyOtp,
    verifyAdminCode, // ✅ new
    deleteAccount,
    
} from "../controllers/auth.controllers.js";

import isAuth from "../middlewares/isAuth.js"; 

const authRouter = express.Router();

// ✅ User and Admin-controlled signup
authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.get("/signout", signOut);

// ✅ OTP & Password Management
authRouter.post("/send-otp", sendOtp);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/reset-password", resetPassword);

// ✅ Google Authentication
authRouter.post("/google-auth", googleAuth);

authRouter.delete("/delete-account", isAuth, deleteAccount);

// ✅ Admin Verification Route (optional — can be used separately if needed)
authRouter.post("/verify-admin-code", verifyAdminCode);

export default authRouter;
