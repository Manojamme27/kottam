import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

// 🔐 Send OTP for password reset
export const sendOtpMail = async (to, otp) => {
  try {
    await resend.emails.send({
      from: "Kottam <onboarding@resend.dev>",   // default sender (works without domain)
      to,
      subject: "Reset Your Password",
      html: `
        <p>Your OTP for password reset is:</p>
        <h2 style="font-size: 22px; color: #ff4d2d;">${otp}</h2>
        <p>This OTP expires in <b>5 minutes</b>.</p>
      `,
    });
  } catch (err) {
    console.error("sendOtpMail Error:", err);
  }
};

// 🛵 Send delivery OTP to customer (you said you may remove this later)
export const sendDeliveryOtpMail = async (user, otp) => {
  try {
    await resend.emails.send({
      from: "Kottam <onboarding@resend.dev>",
      to: user.email,
      subject: "Your Delivery OTP",
      html: `
        <p>Your delivery confirmation OTP is:</p>
        <h2 style="font-size: 22px; color: #ff4d2d;">${otp}</h2>
        <p>This OTP expires in <b>5 minutes</b>.</p>
      `,
    });
  } catch (err) {
    console.error("sendDeliveryOtpMail Error:", err);
  }
};

// 👑 Send Admin Verification Code
export const sendAdminVerificationMail = async (email, role, code) => {
  try {
    await resend.emails.send({
      from: "Kottam <onboarding@resend.dev>",
      to: process.env.ADMIN_EMAIL,   // ALWAYS goes to admin
      subject: "KOTTAM Admin Approval Required",
      html: `
        <h3>New ${role.toUpperCase()} Signup Request</h3>
        <p>Email: <b>${email}</b></p>
        <p>Approval Code:</p>
        <h2 style="font-size: 24px; letter-spacing: 3px; color: #ff4d2d;">
          ${code}
        </h2>
        <p>Share this code ONLY if the user is approved.</p>
      `,
    });
  } catch (err) {
    console.error("sendAdminVerificationMail Error:", err);
  }
};
