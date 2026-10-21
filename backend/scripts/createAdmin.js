"use strict";

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline/promises");
const { stdin, stdout } = require("process");
const User = require("../models/userModel");

async function main() {
    const rl = readline.createInterface({ input: stdin, output: stdout });

    try {
        if (!process.env.MONGO_URI && !process.env.MONGODB_URI) {
            throw new Error("MONGO_URI or MONGODB_URI is missing from backend/.env");
        }

        const name = (await rl.question("Admin full name: ")).trim();
        const email = (await rl.question("Admin email: ")).trim().toLowerCase();
        const mobile = (await rl.question("Admin mobile (10 digits): ")).trim();
        const categoryInput = (await rl.question(
            "Category (ST/SC/OBC/General/Other): "
        )).trim();

        const password = await rl.question("Admin password (minimum 12 characters): ");

        if (name.length < 2) throw new Error("Name must contain at least 2 characters.");
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) throw new Error("Invalid email address.");
        if (!/^[6-9]\\d{9}$/.test(mobile)) throw new Error("Invalid Indian mobile number.");
        if (!["ST", "SC", "OBC", "General", "Other"].includes(categoryInput)) {
            throw new Error("Category must be ST, SC, OBC, General or Other.");
        }
        if (password.length < 12) throw new Error("Use a password of at least 12 characters.");

        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

        const existing = await User.findOne({
            $or: [{ email }, { mobile }]
        });

        if (existing) {
            throw new Error(
                "An account already uses this email or mobile. No account was changed."
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        await User.create({
            fullName: name,
            email,
            mobile,
            category: categoryInput,
            password: passwordHash,
            role: "admin",
            isVerified: true
        });

        console.log("\\nAdmin account created successfully.");
        console.log("Admin email:", email);
        console.log("Open frontend/admin/login.html using your frontend server.");
        console.log("Keep your password private.");

    } finally {
        rl.close();
        await mongoose.disconnect().catch(() => {});
    }
}

main().catch(error => {
    console.error("\\nAdmin setup failed:", error.message);
    process.exitCode = 1;
});
