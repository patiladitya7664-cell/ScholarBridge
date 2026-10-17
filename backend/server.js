"use strict";

// ==================================================
// ScholarBridge AI - BACKEND SERVER
// Node.js + Express + MongoDB
// ==================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDB = require("./config/db");

// ==================================================
// ROUTE IMPORTS
// ==================================================

const authRoutes = require("./routes/authRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const scholarshipRoutes = require("./routes/scholarshipRoutes");

const app = express();

// ==================================================
// CONFIGURATION
// ==================================================

const PORT = Number(process.env.PORT) || 5000;

// ==================================================
// CORS CONFIGURATION
// ==================================================

const defaultAllowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5501",
    "http://127.0.0.1:5501",
    "http://localhost:58082",
    "http://127.0.0.1:58082"
];

const allowedOrigins = [
    ...new Set([
        ...defaultAllowedOrigins,
        ...(process.env.ALLOWED_ORIGINS || "")
            .split(",")
            .map(origin => origin.trim())
            .filter(Boolean)
    ])
];

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("This origin is not allowed by CORS.")
            );
        },

        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ],

        credentials: false
    })
);

// ==================================================
// BODY PARSERS
// ==================================================

app.use(express.json({ limit: "20kb" }));

app.use(
    express.urlencoded({
        extended: true,
        limit: "20kb"
    })
);

// ==================================================
// ROOT ROUTE
// ==================================================

app.get("/", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "ScholarBridge AI backend is running."
    });
});

// ==================================================
// HEALTH CHECK
// ==================================================

app.get("/api/health", (req, res) => {
    const databaseConnected =
        mongoose.connection.readyState === 1;

    return res.status(databaseConnected ? 200 : 503).json({
        success: databaseConnected,

        message: databaseConnected
            ? "ScholarBridge AI API is running."
            : "API is running, but the database is unavailable.",

        database: databaseConnected
            ? "Connected"
            : "Disconnected",

        timestamp: new Date().toISOString()
    });
});

// ==================================================
// API ROUTES
// ==================================================

// Authentication:
// POST /api/auth/register
// POST /api/auth/login
// Other endpoints depend on authRoutes.js.
app.use("/api/auth", authRoutes);

// Scholarships:
// GET    /api/scholarships
// GET    /api/scholarships/:id
// POST   /api/scholarships
// PUT    /api/scholarships/:id
// DELETE /api/scholarships/:id
app.use("/api/scholarships", scholarshipRoutes);

// Applications:
// POST /api/applications
// GET  /api/applications
// GET  /api/applications/my
// GET  /api/applications/:id
// PUT  /api/applications/:id/status
app.use("/api/applications", applicationRoutes);

// ==================================================
// UNKNOWN API ROUTES
// ==================================================

app.use("/api", (req, res) => {
    return res.status(404).json({
        success: false,
        message: "API route not found."
    });
});

// ==================================================
// UNKNOWN PAGE ROUTES
// ==================================================

app.use((req, res) => {
    return res.status(404).json({
        success: false,
        message: "Route not found."
    });
});

// ==================================================
// GLOBAL ERROR HANDLER
// ==================================================

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body."
        });
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request body is too large."
        });
    }

    if (
        err.message ===
        "This origin is not allowed by CORS."
    ) {
        return res.status(403).json({
            success: false,
            message: "This origin is not allowed."
        });
    }

    console.error("Server error:", err.message);

    return res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

// ==================================================
// START SERVER
// ==================================================

let server;

async function startServer() {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error(
                "JWT_SECRET is missing from the backend .env file."
            );
        }

        await connectDB();

        server = app.listen(PORT, () => {
            console.log("======================================");
            console.log("   ScholarBridge AI Backend");
            console.log("======================================");
            console.log(`Server:       http://localhost:${PORT}`);
            console.log(`Health:       http://localhost:${PORT}/api/health`);
            console.log(`Auth:         http://localhost:${PORT}/api/auth`);
            console.log(`Scholarships: http://localhost:${PORT}/api/scholarships`);
            console.log(`Applications: http://localhost:${PORT}/api/applications`);
            console.log("MongoDB connection initialized.");
            console.log("======================================");
        });

        server.on("error", error => {
            console.error(
                "HTTP server error:",
                error.message
            );

            process.exitCode = 1;
        });

    } catch (error) {
        console.error(
            "Backend startup failed:",
            error.message
        );

        process.exitCode = 1;
    }
}

// ==================================================
// GRACEFUL SHUTDOWN
// ==================================================

async function shutdown(signal) {
    console.log(
        `\n${signal} received. Shutting down backend...`
    );

    if (server) {
        server.close(async () => {
            try {
                await mongoose.connection.close();

                console.log(
                    "Backend shut down successfully."
                );

                process.exit(0);

            } catch (error) {
                console.error(
                    "Shutdown error:",
                    error.message
                );

                process.exit(1);
            }
        });
    } else {
        try {
            await mongoose.connection.close();
        } finally {
            process.exit(0);
        }
    }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ==================================================
// EXPORT APP
// ==================================================

if (require.main === module) {
    startServer();
}

module.exports = app;
