"use strict";

/* =========================================================
   ScholarBridge AI
   File: backend/controllers/scholarshipController.js

   Features:
   1. Get all scholarships
   2. Search and filter scholarships
   3. Get scholarship by ID
   4. Create scholarship
   5. Update scholarship
   6. Delete scholarship
========================================================= */

const mongoose = require("mongoose");
const Scholarship = require("../models/ScholarshipModel");

/* =========================================================
   HELPER: Escape regular expression input
========================================================= */

const escapeRegex = (value) => {
    return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
};

/* =========================================================
   HELPER: Find scholarship by MongoDB ID or custom ID
========================================================= */

const findScholarshipById = async (id) => {
    if (mongoose.Types.ObjectId.isValid(id)) {
        const scholarship = await Scholarship.findById(id);

        if (scholarship) {
            return scholarship;
        }
    }

    return Scholarship.findOne({
        scholarshipId: String(id)
    });
};

/* =========================================================
   1. GET ALL SCHOLARSHIPS

   GET /api/scholarships

   Query parameters:
   ?search=merit
   ?category=SC
   ?educationLevel=Undergraduate
   ?status=Active
   ?page=1&limit=10
========================================================= */

const getAllScholarships = async (req, res) => {
    try {
        const {
            search,
            category,
            educationLevel,
            status,
            page = 1,
            limit = 10
        } = req.query;

        const pageNumber = Math.max(
            1,
            parseInt(page, 10) || 1
        );

        const pageSize = Math.min(
            100,
            Math.max(1, parseInt(limit, 10) || 10)
        );

        const filter = {};

        // Search scholarship name, provider or description.
        if (search && search.trim()) {
            const searchRegex = new RegExp(
                escapeRegex(search.trim()),
                "i"
            );

            filter.$or = [
                { title: searchRegex },
                { name: searchRegex },
                { provider: searchRegex },
                { organization: searchRegex },
                { description: searchRegex }
            ];
        }

        // Category filter.
        if (category) {
            filter.category = category.trim();
        }

        // Education level filter.
        if (educationLevel) {
            filter.educationLevel = educationLevel.trim();
        }

        // Status filter.
        if (status) {
            filter.status = status.trim();
        }

        const skip = (pageNumber - 1) * pageSize;

        const [scholarships, totalScholarships] =
            await Promise.all([
                Scholarship.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(pageSize)
                    .lean(),

                Scholarship.countDocuments(filter)
            ]);

        return res.status(200).json({
            success: true,
            message: "Scholarships retrieved successfully.",
            count: scholarships.length,
            scholarships,
            pagination: {
                currentPage: pageNumber,
                limit: pageSize,
                totalScholarships,
                totalPages: Math.ceil(
                    totalScholarships / pageSize
                )
            }
        });

    } catch (error) {
        console.error(
            "Get scholarships error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve scholarships."
        });
    }
};

/* =========================================================
   2. GET SCHOLARSHIP BY ID

   GET /api/scholarships/:id
========================================================= */

const getScholarshipById = async (req, res) => {
    try {
        const scholarship = await findScholarshipById(
            req.params.id
        );

        if (!scholarship) {
            return res.status(404).json({
                success: false,
                message: "Scholarship not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Scholarship details retrieved successfully.",
            scholarship
        });

    } catch (error) {
        console.error(
            "Get scholarship details error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve scholarship details."
        });
    }
};

/* =========================================================
   3. CREATE SCHOLARSHIP

   POST /api/scholarships

   Admin-only access must be enforced by route middleware.
========================================================= */

const createScholarship = async (req, res) => {
    try {
        const {
            scholarshipId,
            title,
            name,
            description,
            provider,
            organization,
            category,
            educationLevel,
            amount,
            awardAmount,
            deadline,
            eligibility,
            eligibilityCriteria,
            applicationUrl,
            website,
            requiredDocuments,
            status
        } = req.body;

        const scholarshipName = title || name;

        if (!scholarshipName || !description) {
            return res.status(400).json({
                success: false,
                message: "Scholarship title and description are required."
            });
        }

        const finalAmount = amount ?? awardAmount;

        if (
            finalAmount !== undefined &&
            (
                !Number.isFinite(Number(finalAmount)) ||
                Number(finalAmount) < 0
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "Scholarship amount must be a valid non-negative number."
            });
        }

        if (
            deadline &&
            Number.isNaN(Date.parse(deadline))
        ) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid scholarship deadline."
            });
        }

        if (
            status &&
            !["Active", "Inactive", "Closed", "Pending"].includes(status)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid scholarship status."
            });
        }

        const scholarshipData = {
            title: scholarshipName,
            name: scholarshipName,
            description,
            provider: provider || organization || "",
            organization: organization || provider || "",
            category: category || "",
            educationLevel: educationLevel || "",
            amount: finalAmount ?? 0,
            awardAmount: finalAmount ?? 0,
            deadline: deadline || null,
            eligibility: eligibility || eligibilityCriteria || "",
            eligibilityCriteria: eligibilityCriteria || eligibility || "",
            applicationUrl: applicationUrl || website || "",
            website: website || applicationUrl || "",
            requiredDocuments: Array.isArray(requiredDocuments)
                ? requiredDocuments
                : [],
            status: status || "Active"
        };

        if (scholarshipId) {
            scholarshipData.scholarshipId = scholarshipId;
        }

        const scholarship = await Scholarship.create(
            scholarshipData
        );

        return res.status(201).json({
            success: true,
            message: "Scholarship created successfully.",
            scholarship
        });

    } catch (error) {
        console.error(
            "Create scholarship error:",
            error.message
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A scholarship with this ID already exists."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Scholarship validation failed.",
                errors: Object.values(error.errors).map(
                    item => item.message
                )
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to create scholarship."
        });
    }
};

/* =========================================================
   4. UPDATE SCHOLARSHIP

   PUT /api/scholarships/:id

   Admin-only access must be enforced by route middleware.
========================================================= */

const updateScholarship = async (req, res) => {
    try {
        const scholarship = await findScholarshipById(
            req.params.id
        );

        if (!scholarship) {
            return res.status(404).json({
                success: false,
                message: "Scholarship not found."
            });
        }

        const allowedFields = [
            "scholarshipId",
            "title",
            "name",
            "description",
            "provider",
            "organization",
            "category",
            "educationLevel",
            "amount",
            "awardAmount",
            "deadline",
            "eligibility",
            "eligibilityCriteria",
            "applicationUrl",
            "website",
            "requiredDocuments",
            "status"
        ];

        for (const field of allowedFields) {
            if (
                Object.prototype.hasOwnProperty.call(
                    req.body,
                    field
                )
            ) {
                scholarship.set(field, req.body[field]);
            }
        }

        // Keep alternative field names synchronized.
        if (req.body.title !== undefined) {
            scholarship.name = req.body.title;
        } else if (req.body.name !== undefined) {
            scholarship.title = req.body.name;
        }

        if (req.body.provider !== undefined) {
            scholarship.organization = req.body.provider;
        } else if (req.body.organization !== undefined) {
            scholarship.provider = req.body.organization;
        }

        if (req.body.amount !== undefined) {
            scholarship.awardAmount = req.body.amount;
        } else if (req.body.awardAmount !== undefined) {
            scholarship.amount = req.body.awardAmount;
        }

        if (req.body.eligibility !== undefined) {
            scholarship.eligibilityCriteria = req.body.eligibility;
        } else if (req.body.eligibilityCriteria !== undefined) {
            scholarship.eligibility = req.body.eligibilityCriteria;
        }

        if (req.body.applicationUrl !== undefined) {
            scholarship.website = req.body.applicationUrl;
        } else if (req.body.website !== undefined) {
            scholarship.applicationUrl = req.body.website;
        }

        await scholarship.save();

        return res.status(200).json({
            success: true,
            message: "Scholarship updated successfully.",
            scholarship
        });

    } catch (error) {
        console.error(
            "Update scholarship error:",
            error.message
        );

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A scholarship with this ID already exists."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Scholarship validation failed.",
                errors: Object.values(error.errors).map(
                    item => item.message
                )
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to update scholarship."
        });
    }
};

/* =========================================================
   5. DELETE SCHOLARSHIP

   DELETE /api/scholarships/:id

   Admin-only access must be enforced by route middleware.
========================================================= */

const deleteScholarship = async (req, res) => {
    try {
        const scholarship = await findScholarshipById(
            req.params.id
        );

        if (!scholarship) {
            return res.status(404).json({
                success: false,
                message: "Scholarship not found."
            });
        }

        await scholarship.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Scholarship deleted successfully."
        });

    } catch (error) {
        console.error(
            "Delete scholarship error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to delete scholarship."
        });
    }
};

/* =========================================================
   EXPORT CONTROLLERS
========================================================= */

module.exports = {
    getAllScholarships,
    getScholarshipById,
    createScholarship,
    updateScholarship,
    deleteScholarship
};

