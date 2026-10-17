"use strict";

// ==================================================
// ScholarBridgee AI - USER MODEL
// Student Authentication and Profile
// ==================================================

const mongoose = require("mongoose");

// ==================================================
// USER SCHEMA
// ==================================================

const userSchema = new mongoose.Schema(
    {
        // Student full name
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            minlength: 2,
            maxlength: 100
        },

        // Unique email address
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                "Please enter a valid email address"
            ]
        },

        // Unique Indian mobile number
        mobile: {
            type: String,
            required: [true, "Mobile number is required"],
            unique: true,
            trim: true,
            match: [
                /^[6-9]\d{9}$/,
                "Please enter a valid 10-digit Indian mobile number"
            ]
        },

        // Student category
        category: {
            type: String,
            required: [true, "Category is required"],
            enum: ["ST", "SC", "OBC", "General", "Other"]
        },

        // Password is stored as a bcrypt hash by the controller.
        // It is excluded from normal queries.
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 8,
            select: false
        },

        // Account role
        role: {
            type: String,
            enum: ["student", "admin"],
            default: "student"
        },

        // Email verification status
        isVerified: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// ==================================================
// EXPORT MODEL
// ==================================================

module.exports = mongoose.model("User", userSchema);