"use strict";

// ==================================================
// ScholarBridgee AI - AUTH CONTROLLER
// Node.js + Express + MongoDB
// Registration, OTP, Login & Password Recovery
// ==================================================

const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const OTP = require("../models/otpModel");

const {
  sendRegistrationOTP,
  sendPasswordResetOTP,
} = require("../services/emailService");

// ==================================================
// 1. CONSTANTS
// ==================================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_PATTERN = /^[6-9]\d{9}$/;

const ALLOWED_CATEGORIES = ["ST", "SC", "OBC", "General", "Other"];

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

// ==================================================
// 2. COMMON HELPERS
// ==================================================

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function hashOTP(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeCompareHashes(firstHash, secondHash) {
  if (
    typeof firstHash !== "string" ||
    typeof secondHash !== "string" ||
    !/^[a-f0-9]{64}$/i.test(firstHash) ||
    !/^[a-f0-9]{64}$/i.test(secondHash)
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(firstHash, "hex"),
    Buffer.from(secondHash, "hex"),
  );
}

function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}

function publicUser(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    mobile: user.mobile,
    category: user.category,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

// ==================================================
// 3. CREATE AND SEND OTP
// ==================================================

async function createAndSendOTP({
  email,
  purpose,
  sendEmail,
  registrationData,
}) {
  const now = Date.now();

  const existingOTP = await OTP.findOne({
    email,
    purpose,
  });

  // Enforce the resend cooldown.
  if (
    existingOTP &&
    existingOTP.createdAt &&
    now - new Date(existingOTP.createdAt).getTime() < RESEND_COOLDOWN_MS
  ) {
    const elapsed = now - new Date(existingOTP.createdAt).getTime();

    const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);

    const error = new Error(
      `Please wait ${remainingSeconds} seconds before requesting another OTP.`,
    );

    error.statusCode = 429;
    throw error;
  }

  const otp = generateOTP();

  const otpData = {
    email,
    otpHash: hashOTP(otp),
    purpose,
    expiresAt: new Date(now + OTP_EXPIRY_MS),
    attempts: 0,
    verified: false,

    // Invalidate any previously issued reset token.
    resetTokenHash: undefined,
  };

  if (registrationData) {
    otpData.registrationData = registrationData;
  }

  const otpRecord = existingOTP
    ? Object.assign(existingOTP, otpData)
    : new OTP(otpData);

  await otpRecord.save();

  try {
    await sendEmail(email, otp);
  } catch (error) {
    // Remove the OTP if the email could not be sent.
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    throw error;
  }

  return otpRecord;
}

// ==================================================
// 4. FIND VALID OTP
// ==================================================

async function findValidOTP(email, purpose) {
  return OTP.findOne({
    email,
    purpose,
    expiresAt: {
      $gt: new Date(),
    },
  }).select("+otpHash +resetTokenHash");
}

// ==================================================
// 5. REGISTER STUDENT - SEND REGISTRATION OTP
// ==================================================

const registerUser = async (req, res) => {
  try {
    const { fullName, email, mobile, category, password, confirmPassword } =
      req.body || {};

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof mobile !== "string" ||
      typeof category !== "string" ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return sendError(res, 400, "Please fill in all required fields.");
    }

    const normalizedName = fullName.trim();
    const normalizedEmail = normalizeEmail(email);
    const normalizedMobile = mobile.trim();

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      return sendError(res, 400, "Name must contain 2 to 100 characters.");
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    if (!MOBILE_PATTERN.test(normalizedMobile)) {
      return sendError(
        res,
        400,
        "Enter a valid 10-digit Indian mobile number.",
      );
    }

    if (!ALLOWED_CATEGORIES.includes(category)) {
      return sendError(res, 400, "Please select a valid category.");
    }

    if (password.length < 8) {
      return sendError(
        res,
        400,
        "Password must contain at least 8 characters.",
      );
    }

    if (password !== confirmPassword) {
      return sendError(res, 400, "Passwords do not match.");
    }

    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return sendError(
        res,
        409,
        "An account with this email already exists. Please login.",
      );
    }

    const existingMobile = await User.findOne({
      mobile: normalizedMobile,
    });

    if (existingMobile) {
      return sendError(res, 409, "This mobile number is already registered.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await createAndSendOTP({
      email: normalizedEmail,
      purpose: "registration",
      sendEmail: sendRegistrationOTP,

      registrationData: {
        fullName: normalizedName,
        mobile: normalizedMobile,
        category,
        passwordHash,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Verification OTP sent to your email. Please verify your account.",
      email: normalizedEmail,
      expiresIn: 600,
      resendAfter: 60,
    });
  } catch (error) {
    console.error("Registration error details:", error);

    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }

    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "Email or mobile number is already registered.",
      );
    }

    return sendError(
      res,
      500,
      "Unable to start registration right now. Please try again.",
    );
  }
};

// ==================================================
// 6. VERIFY REGISTRATION OTP
// ==================================================

const verifyRegistrationOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();

    if (!EMAIL_PATTERN.test(email)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    if (!/^\d{6}$/.test(otp)) {
      return sendError(res, 400, "Please enter a valid six-digit OTP.");
    }

    const otpRecord = await findValidOTP(email, "registration");

    if (!otpRecord) {
      return sendError(
        res,
        400,
        "OTP is invalid or expired. Please request a new OTP.",
      );
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return sendError(
        res,
        429,
        "Too many incorrect attempts. Please register again.",
      );
    }

    if (
      !otpRecord.registrationData ||
      !otpRecord.registrationData.passwordHash
    ) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return sendError(
        res,
        400,
        "Registration session expired. Please register again.",
      );
    }

    if (!safeCompareHashes(hashOTP(otp), otpRecord.otpHash)) {
      otpRecord.attempts += 1;

      if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        await OTP.deleteOne({
          _id: otpRecord._id,
        });
      } else {
        await otpRecord.save();
      }

      return sendError(res, 400, "Incorrect OTP. Please try again.");
    }

    const registration = otpRecord.registrationData;

    // Recheck email and mobile uniqueness.
    const duplicateUser = await User.findOne({
      $or: [
        {
          email,
        },
        {
          mobile: registration.mobile,
        },
      ],
    });

    if (duplicateUser) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return sendError(
        res,
        409,
        "Email or mobile number is already registered. Please login.",
      );
    }

    const newUser = await User.create({
      fullName: registration.fullName,
      email,
      mobile: registration.mobile,
      category: registration.category,
      password: registration.passwordHash,
      role: "student",
      isVerified: true,
    });

    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    return res.status(201).json({
      success: true,
      message:
        "Email verified and registration completed successfully. You can now login.",
      user: publicUser(newUser),
    });
  } catch (error) {
    console.error("Registration OTP verification error:", error.message);

    if (error.code === 11000) {
      return sendError(
        res,
        409,
        "Email or mobile number is already registered.",
      );
    }

    return sendError(res, 500, "Unable to verify registration OTP right now.");
  }
};

// ==================================================
// 7. RESEND REGISTRATION OTP
// ==================================================

const resendRegistrationOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!EMAIL_PATTERN.test(email)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return sendError(
        res,
        409,
        "An account already exists for this email. Please login.",
      );
    }

    const pendingOTP = await OTP.findOne({
      email,
      purpose: "registration",
      expiresAt: {
        $gt: new Date(),
      },
    });

    if (
      !pendingOTP ||
      !pendingOTP.registrationData ||
      !pendingOTP.registrationData.passwordHash
    ) {
      return sendError(
        res,
        400,
        "Registration session expired. Please register again.",
      );
    }

    await createAndSendOTP({
      email,
      purpose: "registration",
      sendEmail: sendRegistrationOTP,
      registrationData: pendingOTP.registrationData,
    });

    return res.status(200).json({
      success: true,
      message: "A new verification OTP has been sent.",
      expiresIn: 600,
      resendAfter: 60,
    });
  } catch (error) {
    console.error("Resend registration OTP error:", error.message);

    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }

    return sendError(
      res,
      500,
      "Unable to resend OTP right now. Please try again.",
    );
  }
};

// ==================================================
// 8. LOGIN USER
// ==================================================

const loginUser = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || typeof password !== "string" || !password) {
      return sendError(res, 400, "Email and password are required.");
    }

    if (!EMAIL_PATTERN.test(email)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user) {
      return sendError(res, 401, "Invalid email or password.");
    }

    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      return sendError(res, 401, "Invalid email or password.");
    }

    if (!user.isVerified) {
      return sendError(res, 403, "Please verify your email before logging in.");
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing.");

      return sendError(res, 500, "Authentication configuration error.");
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return sendError(res, 500, "Server error during login.");
  }
};

// ==================================================
// 9. GET LOGGED-IN USER PROFILE
// ==================================================

const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return sendError(res, 404, "User profile not found.");
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      user: publicUser(req.user),
    });
  } catch (error) {
    console.error("Get profile error:", error.message);

    return sendError(res, 500, "Unable to fetch user profile.");
  }
};

// ==================================================
// 10. FORGOT PASSWORD - SEND OTP
// ==================================================

const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!EMAIL_PATTERN.test(email)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    const user = await User.findOne({
      email,
    });

    // Avoid exposing whether an account exists.
    if (!user || !user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "If an account exists for this email, an OTP will be sent.",
      });
    }

    await createAndSendOTP({
      email,
      purpose: "password-reset",
      sendEmail: sendPasswordResetOTP,
    });

    return res.status(200).json({
      success: true,
      message: "If an account exists for this email, an OTP will be sent.",
      expiresIn: 600,
      resendAfter: 60,
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }

    return sendError(
      res,
      503,
      "Unable to send the OTP email. Please try again later.",
    );
  }
};

// ==================================================
// 11. RESEND PASSWORD RESET OTP
// ==================================================

const resendResetOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!EMAIL_PATTERN.test(email)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    const user = await User.findOne({
      email,
    });

    // Do not disclose whether an account exists.
    if (!user || !user.isVerified) {
      return res.status(200).json({
        success: true,
        message: "If the account is eligible, a new OTP will be sent.",
      });
    }

    const existingOTP = await OTP.findOne({
      email,
      purpose: "password-reset",
    });

    if (!existingOTP) {
      return sendError(
        res,
        400,
        "No password reset request was found. Please start again.",
      );
    }

    await createAndSendOTP({
      email,
      purpose: "password-reset",
      sendEmail: sendPasswordResetOTP,
    });

    return res.status(200).json({
      success: true,
      message: "A new password reset OTP has been sent.",
      expiresIn: 600,
      resendAfter: 60,
    });
  } catch (error) {
    console.error("Resend password reset OTP error:", error.message);

    if (error.statusCode) {
      return sendError(res, error.statusCode, error.message);
    }

    return sendError(
      res,
      503,
      "Unable to resend the OTP. Please try again later.",
    );
  }
};

// ==================================================
// 12. VERIFY PASSWORD RESET OTP
// ==================================================

const verifyResetOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp || "").trim();

    if (!EMAIL_PATTERN.test(email)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    if (!/^\d{6}$/.test(otp)) {
      return sendError(res, 400, "Please enter a valid six-digit OTP.");
    }

    const otpRecord = await findValidOTP(email, "password-reset");

    if (!otpRecord) {
      return sendError(
        res,
        400,
        "OTP is invalid or expired. Please request a new OTP.",
      );
    }

    if (otpRecord.verified) {
      return sendError(
        res,
        400,
        "This OTP has already been used. Request a new OTP.",
      );
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return sendError(
        res,
        429,
        "Too many incorrect attempts. Please request a new OTP.",
      );
    }

    if (!safeCompareHashes(hashOTP(otp), otpRecord.otpHash)) {
      otpRecord.attempts += 1;

      if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        await OTP.deleteOne({
          _id: otpRecord._id,
        });
      } else {
        await otpRecord.save();
      }

      return sendError(res, 400, "Incorrect OTP. Please try again.");
    }

    // Mark the OTP as verified.
    otpRecord.verified = true;

    // Generate a random, one-time reset authorization token.
    const resetToken = crypto.randomBytes(32).toString("hex");

    otpRecord.resetTokenHash = hashOTP(resetToken);

    await otpRecord.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
      resetToken,
    });
  } catch (error) {
    console.error("Password reset OTP verification error:", error.message);

    return sendError(res, 500, "Unable to verify OTP right now.");
  }
};

// ==================================================
// 13. RESET PASSWORD
// ==================================================

const resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    // Frontend must send newPassword.
    const newPassword = req.body?.newPassword;
    const confirmPassword = req.body?.confirmPassword;

    const resetToken = String(req.body?.resetToken || "");

    if (!EMAIL_PATTERN.test(email)) {
      return sendError(res, 400, "Please enter a valid email address.");
    }

    if (
      typeof newPassword !== "string" ||
      typeof confirmPassword !== "string"
    ) {
      return sendError(res, 400, "Please enter and confirm your new password.");
    }

    if (newPassword.length < 8) {
      return sendError(
        res,
        400,
        "Password must contain at least 8 characters.",
      );
    }

    if (newPassword !== confirmPassword) {
      return sendError(res, 400, "Passwords do not match.");
    }

    if (!/^[a-f0-9]{64}$/i.test(resetToken)) {
      return sendError(res, 400, "Please verify your OTP again.");
    }

    const otpRecord = await OTP.findOne({
      email,
      purpose: "password-reset",
      verified: true,
      expiresAt: {
        $gt: new Date(),
      },
    }).select("+otpHash +resetTokenHash");

    if (
      !otpRecord ||
      !otpRecord.resetTokenHash ||
      !safeCompareHashes(hashOTP(resetToken), otpRecord.resetTokenHash)
    ) {
      return sendError(
        res,
        400,
        "Password reset authorization is invalid or expired. Please start again.",
      );
    }

    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user || !user.isVerified) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return sendError(
        res,
        400,
        "Unable to reset password. Please request a new OTP.",
      );
    }

    user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    // Delete the OTP and reset token to prevent reuse.
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    return res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);

    return sendError(res, 500, "Unable to reset password right now.");
  }
};

// ==================================================
// 14. EXPORT CONTROLLER FUNCTIONS
// ==================================================

module.exports = {
  registerUser,
  verifyRegistrationOTP,
  resendRegistrationOTP,
  loginUser,
  getUserProfile,
  forgotPassword,
  resendResetOTP,
  verifyResetOTP,
  resetPassword,
};
