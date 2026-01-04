import express from "express";
import {
  googleAuth,
  resetPassword,
  sendOtp,
  signIn,
  signOut,
  signUp,
  verifyOtp,
  verifyAdminCode,
  deleteAccount,
} from "../controllers/auth.controllers.js";

import isAuth from "../middlewares/isAuth.js"; 
import User from "../models/user.model.js";   // 🔥 ADD

const authRouter = express.Router();

// existing routes
authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.get("/signout", signOut);

// 🔥 ADD THIS ROUTE
authRouter.get("/me", isAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// OTP & Password
authRouter.post("/send-otp", sendOtp);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/reset-password", resetPassword);

// Google
authRouter.post("/google-auth", googleAuth);

// Delete
authRouter.delete("/delete-account", isAuth, deleteAccount);

// Admin
authRouter.post("/verify-admin-code", verifyAdminCode);

export default authRouter;
