"use strict";

const mongoose = require("mongoose");

// ========================================
// ScholarBridgee AI - DATABASE CONNECTION
// ========================================

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URI;

        if (!mongoURI) {
            throw new Error(
                "MONGODB_URI is missing in the backend .env file."
            );
        }

        // Connect to MongoDB
        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 10000
        });

        console.log("======================================");
        console.log("MongoDB connected successfully!");
        console.log(`Database: ${mongoose.connection.name}`);
        console.log(`Host: ${mongoose.connection.host}`);
        console.log("======================================");

        return mongoose.connection;

    } catch (error) {
        console.error(
            "MongoDB connection failed:",
            error.message
        );

        throw error;
    }
};

// ========================================
// DATABASE CONNECTION EVENTS
// ========================================

mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected!");
});

mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected successfully!");
});

mongoose.connection.on("error", error => {
    console.error("MongoDB connection error:", error.message);
});

module.exports = connectDB;