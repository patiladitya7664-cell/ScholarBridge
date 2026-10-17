"use strict";

/* =========================================================
   ScholarBridge AI
   File: backend/models/Scholarship.js

   Features:
   1. Scholarship information
   2. Eligibility criteria
   3. Scholarship amount and deadline
   4. Required documents
   5. Application links
   6. Scholarship status
   7. Automatic timestamps
========================================================= */

const mongoose = require("mongoose");

/* =========================================================
   REQUIRED DOCUMENT SCHEMA
========================================================= */

const requiredDocumentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        required: {
            type: Boolean,
            default: true
        }
    },
    {
        _id: false
    }
);

/* =========================================================
   SCHOLARSHIP SCHEMA
========================================================= */

const scholarshipSchema = new mongoose.Schema(
    {
        // Unique scholarship reference.
        scholarshipId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },

        // Scholarship title.
        title: {
            type: String,
            required: true,
            trim: true
        },

        // Alternative name used by the controller.
        name: {
            type: String,
            trim: true,
            default: ""
        },

        // Scholarship description.
        description: {
            type: String,
            required: true,
            trim: true
        },

        // Scholarship provider.
        provider: {
            type: String,
            trim: true,
            default: ""
        },

        // Alternative provider field.
        organization: {
            type: String,
            trim: true,
            default: ""
        },

        // Eligible student category.
        category: {
            type: String,
            trim: true,
            default: "",
            index: true
        },

        // Eligible education level.
        educationLevel: {
            type: String,
            trim: true,
            default: "",
            index: true
        },

        // Scholarship award amount.
        amount: {
            type: Number,
            min: 0,
            default: 0
        },

        // Alternative amount field.
        awardAmount: {
            type: Number,
            min: 0,
            default: 0
        },

        // Last date to apply.
        deadline: {
            type: Date,
            default: null
        },

        // Eligibility information.
        eligibility: {
            type: String,
            trim: true,
            default: ""
        },

        // Alternative eligibility field.
        eligibilityCriteria: {
            type: String,
            trim: true,
            default: ""
        },

        // Official application URL.
        applicationUrl: {
            type: String,
            trim: true,
            default: ""
        },

        // Alternative website field.
        website: {
            type: String,
            trim: true,
            default: ""
        },

        // Documents required for the application.
        requiredDocuments: {
            type: [requiredDocumentSchema],
            default: []
        },

        // Scholarship availability.
        status: {
            type: String,
            enum: [
                "Active",
                "Inactive",
                "Closed",
                "Pending"
            ],
            default: "Active",
            index: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

/* =========================================================
   DATABASE INDEXES
========================================================= */

// Sort scholarships by creation date.
scholarshipSchema.index({
    createdAt: -1
});

// Find scholarships by status and deadline.
scholarshipSchema.index({
    status: 1,
    deadline: 1
});

/* =========================================================
   EXPORT MODEL
========================================================= */

module.exports = mongoose.model(
    "Scholarship",
    scholarshipSchema
);
