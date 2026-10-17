"use strict";

// ==================================================
// ScholarBridgee AI - OTP MODEL
// Registration OTP + Password Reset OTP
// ==================================================

const mongoose = require("mongoose");

// ==================================================
// OTP SCHEMA
// ==================================================

const otpSchema = new mongoose.Schema(
    {
        // User email
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true
        },

        // Hashed OTP — plain OTP database mein store nahi hota
        otpHash: {
            type: String,
            required: true,
            select: false
        },

        // Hashed password-reset authorization token
        resetTokenHash: {
            type: String,
            select: false,
            default: undefined
        },

        // OTP purpose
        purpose: {
            type: String,
            enum: ["registration", "password-reset"],
            required: true
        },

        // OTP expiry — MongoDB TTL index
        expiresAt: {
            type: Date,
            required: true,
            index: {
                expires: 0
            }
        },

        // Failed OTP verification attempts
        attempts: {
            type: Number,
            default: 0,
            min: 0
        },

        // OTP verification status
        verified: {
            type: Boolean,
            default: false
        },

        // Temporary registration data
        registrationData: {
            fullName: {
                type: String,
                trim: true
            },

            mobile: {
                type: String,
                trim: true
            },

            category: {
                type: String,
                enum: ["ST", "SC", "OBC", "General", "Other"]
            },

            // This must contain a bcrypt-hashed password,
            // never the original plain-text password.
            passwordHash: {
                type: String,
                required: function () {
                    return this.purpose === "registration";
                }
            }
        }
    },
    {
        timestamps: true
    }
);

// ==================================================
// UNIQUE RECORD PER EMAIL AND OTP PURPOSE
// ==================================================

otpSchema.index(
    {
        email: 1,
        purpose: 1
    },
    {
        unique: true
    }
);

// ==================================================
// EXPORT MODEL
// ==================================================

module.exports = mongoose.model("OTP", otpSchema);