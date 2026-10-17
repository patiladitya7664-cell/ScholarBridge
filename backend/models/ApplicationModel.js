"use strict";

/* =========================================================
   ScholarBridge AI
   File: backend/models/Application.js

   Purpose:
   - Store scholarship applications in MongoDB
   - Maintain student and scholarship information
   - Track application status
   - Store uploaded document references
   - Maintain admin remarks and processing dates
========================================================= */

const mongoose = require("mongoose");

/* =========================================================
   DOCUMENT SUB-SCHEMA
========================================================= */

const documentSchema = new mongoose.Schema(
    {
        documentName: {
            type: String,
            trim: true,
            default: ""
        },

        documentType: {
            type: String,
            trim: true,
            default: ""
        },

        fileName: {
            type: String,
            trim: true,
            default: ""
        },

        fileUrl: {
            type: String,
            trim: true,
            default: ""
        },

        uploadedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        _id: true
    }
);

/* =========================================================
   APPLICATION SCHEMA
========================================================= */

const applicationSchema = new mongoose.Schema(
    {
        // Unique application reference.
        applicationId: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        // Logged-in student's MongoDB User ID.
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        // Scholarship information.
        scholarshipId: {
            type: String,
            required: true,
            trim: true
        },

        scholarshipName: {
            type: String,
            required: true,
            trim: true
        },

        // Student information.
        name: {
            type: String,
            required: true,
            trim: true
        },

        fullName: {
            type: String,
            trim: true,
            default: ""
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        mobile: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            trim: true,
            default: ""
        },

        // Academic information.
        course: {
            type: String,
            trim: true,
            default: ""
        },

        institution: {
            type: String,
            trim: true,
            default: ""
        },

        academicYear: {
            type: String,
            trim: true,
            default: ""
        },

        familyIncome: {
            type: Number,
            min: 0,
            default: null
        },

        // Personal and application details.
        address: {
            type: String,
            trim: true,
            default: ""
        },

        purpose: {
            type: String,
            trim: true,
            default: ""
        },

        additionalDetails: {
            type: String,
            trim: true,
            default: ""
        },

        // Optional document information.
        documentDetails: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        documents: {
            type: [documentSchema],
            default: []
        },

        // Application review status.
        status: {
            type: String,
            enum: [
                "Pending",
                "Under Review",
                "Approved",
                "Rejected",
                "Completed"
            ],
            default: "Pending",
            index: true
        },

        // Admin review information.
        adminRemark: {
            type: String,
            trim: true,
            default: ""
        },

        processedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

/* =========================================================
   INDEXES
========================================================= */

// Student application history.
applicationSchema.index({
    userId: 1,
    createdAt: -1
});

// Admin filtering and reporting.
applicationSchema.index({
    status: 1,
    createdAt: -1
});

// Export model.
module.exports = mongoose.model(
    "Application",
    applicationSchema
);
