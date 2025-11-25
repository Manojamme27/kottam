import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import genToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";
import nodemailer from "nodemailer";

let pendingAdminCodes = {}; // store { email: code }

export const signUp = async (req, res) => {
    try {
        const { fullName, email, password, mobile, role, adminCode } = req.body;

        // ✅ Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: "User already exists." });
        }

        if (password.length < 6) {
            return res
                .status(400)
                .json({ message: "Password must be at least 6 characters." });
        }
        if (mobile.length < 10) {
            return res
                .status(400)
                .json({ message: "Mobile number must be at least 10 digits." });
        }

        // ✅ Owner or DeliveryBoy — needs admin verification
        if (role === "owner" || role === "deliveryBoy") {
            if (!adminCode) {
                // Step 1: Generate and send code to admin email
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                pendingAdminCodes[email] = code;

                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.ADMIN_EMAIL,
                        pass: process.env.ADMIN_PASS, // add this to .env
                    },
                });

                await transporter.sendMail({
                    from: process.env.ADMIN_EMAIL,
                    to: process.env.ADMIN_EMAIL,
                    subject: "🔐 KOTTAM Admin Verification Code",
                    text: `A new ${role.toUpperCase()} signup request:\n\nEmail: ${email}\nVerification Code: ${code}\n\nShare this code only if you approve the signup.`,
                });

                return res.status(202).json({
                    message:
                        "Verification code sent to admin. Ask admin for code and try again.",
                });
            } else {
                // Step 2: Verify code before creating user
                if (pendingAdminCodes[email] !== adminCode) {
                    return res.status(400).json({ message: "Invalid admin code." });
                }
                delete pendingAdminCodes[email]; // cleanup
            }
        }

        // ✅ Proceed with normal signup
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
            fullName,
            email,
            mobile,
            role,
            password: hashedPassword,
        });

        const token = await genToken(user._id);
        res.cookie("token", token, {
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        });

        return res.status(201).json(user);
    } catch (error) {
        console.error("❌ signUp error:", error);
        return res.status(500).json({ message: `sign up error ${error.message}` });
    }
};

export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User does not exist." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect password." });
        }

        const token = await genToken(user._id);
        res.cookie("token", token, {
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        });

        return res.status(200).json(user);
    } catch (error) {
        console.error("❌ signIn error:", error);
        console.log("🟢 LOGIN SUCCESS:", user._id, "ROLE:", user.role);

        return res.status(500).json({ message: `sign in error ${error.message}` });
    }
};

export const signOut = async (req, res) => {
    try {
        res.clearCookie("token");
        return res.status(200).json({ message: "Log out successfully." });
    } catch (error) {
        return res.status(500).json({ message: `sign out error ${error}` });
    }
};

export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "User does not exist." });
        }

        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        user.resetOtp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000;
        user.isOtpVerified = false;
        await user.save();

        await sendOtpMail(email, otp);
        return res.status(200).json({ message: "OTP sent successfully." });
    } catch (error) {
        return res.status(500).json({ message: `send otp error ${error}` });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.resetOtp != otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        user.isOtpVerified = true;
        user.resetOtp = undefined;
        user.otpExpires = undefined;
        await user.save();

        return res.status(200).json({ message: "OTP verified successfully." });
    } catch (error) {
        return res.status(500).json({ message: `verify otp error ${error}` });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user || !user.isOtpVerified) {
            return res.status(400).json({ message: "OTP verification required." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.isOtpVerified = false;
        await user.save();

        return res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
        return res.status(500).json({ message: `reset password error ${error}` });
    }
};

export const googleAuth = async (req, res) => {
    try {
        const { fullName, email, mobile, role } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ fullName, email, mobile, role });
        }

        const token = await genToken(user._id);
        res.cookie("token", token, {
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            httpOnly: true,
        });

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({ message: `googleAuth error ${error}` });
    }
};
export const verifyAdminCode = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (pendingAdminCodes[email] && pendingAdminCodes[email] === code) {
            delete pendingAdminCodes[email];
            return res.status(200).json({ message: "Admin code verified successfully" });
        } else {
            return res.status(400).json({ message: "Invalid or expired code" });
        }
    } catch (error) {
        return res.status(500).json({ message: `verifyAdminCode error ${error}` });
    }
};
export const deleteAccount = async (req, res) => {
    try {
        const userId = req.userId; // from auth middleware

        if (!userId) {
            return res.status(400).json({ message: "User not authenticated" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await User.findByIdAndDelete(userId);
        res.clearCookie("token");

        return res.status(200).json({ message: "Account deleted successfully" });
    } catch (error) {
        return res.status(500).json({ message: `Delete account error: ${error}` });
    }
};


