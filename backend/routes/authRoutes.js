"use strict";

// ==================================================
// ScholarBridgee AI - AUTH ROUTES
// ==================================================

const express = require("express");
const router = express.Router();

const {
    registerUser,
    verifyRegistrationOTP,
    resendRegistrationOTP,
    loginUser,
    getUserProfile,
    forgotPassword,
    resendResetOTP,
    verifyResetOTP,
    resetPassword
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// ==================================================
// STUDENT REGISTRATION & EMAIL VERIFICATION
// ==================================================

// Register student and send OTP
router.post("/register", registerUser);

// Verify registration OTP
router.post("/verify-registration-otp", verifyRegistrationOTP);

// Resend registration OTP
router.post("/resend-registration-otp", resendRegistrationOTP);

// ==================================================
// LOGIN & PROFILE
// ==================================================

// Student login
router.post("/login", loginUser);

// Get logged-in user's profile
router.get("/profile", protect, getUserProfile);

// ==================================================
// FORGOT PASSWORD & RESET
// ==================================================

// Request password reset OTP
router.post("/forgot-password", forgotPassword);

// Resend password reset OTP
router.post("/resend-reset-otp", resendResetOTP);

// Verify password reset OTP
router.post("/verify-reset-otp", verifyResetOTP);

// Reset password using verified reset token
router.post("/reset-password", resetPassword);

// ==================================================
// EXPORT ROUTER
// ==================================================

module.exports = router;