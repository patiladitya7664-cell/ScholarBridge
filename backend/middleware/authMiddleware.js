"use strict";

// ==================================================
// ScholarBridgee AI - AUTHENTICATION MIDDLEWARE
// JWT Authentication + Role Authorization
// ==================================================

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/userModel");

// ==================================================
// 1. AUTHENTICATION MIDDLEWARE
// ==================================================

const protect = async (req, res, next) => {
    try {
        // Step 1: Read Authorization header
        const authHeader = req.headers.authorization;

        if (
            typeof authHeader !== "string" ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please login first."
            });
        }

        // Step 2: Extract token
        const token = authHeader.slice(7).trim();

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing."
            });
        }

        // Step 3: Check JWT secret
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing.");

            return res.status(500).json({
                success: false,
                message: "Authentication configuration error."
            });
        }

        // Step 4: Verify JWT
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            {
                algorithms: ["HS256"]
            }
        );

        // Step 5: Validate token payload
        if (
            !decoded ||
            typeof decoded.userId !== "string" ||
            !mongoose.Types.ObjectId.isValid(decoded.userId)
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid authentication token. Please login again."
            });
        }

        // Step 6: Find the current user
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User account not found. Please login again."
            });
        }

        // Step 7: Reject unverified accounts
        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "Please verify your email before continuing."
            });
        }

        // Step 8: Attach authenticated user
        req.user = user;

        // Step 9: Continue
        return next();

    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError" ||
            error.name === "NotBeforeError"
        ) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token. Please login again."
            });
        }

        console.error(
            "Authentication middleware error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Authentication failed. Please try again."
        });
    }
};

// ==================================================
// 2. ROLE AUTHORIZATION MIDDLEWARE
// ==================================================

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // User must be authenticated first
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Please login first."
            });
        }

        // Validate allowed roles
        if (
            roles.length === 0 ||
            !roles.every(role => typeof role === "string")
        ) {
            return res.status(500).json({
                success: false,
                message: "Role authorization configuration error."
            });
        }

        // Check user role
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource."
            });
        }

        return next();
    };
};

// ==================================================
// 3. EXPORT MIDDLEWARE
// ==================================================

module.exports = {
    protect,
    authorizeRoles
};