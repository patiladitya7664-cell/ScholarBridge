
"use strict";

/* =========================================================
   ScholarBridge AI
   File: backend/controllers/applicationController.js

   Features:
   1. Create scholarship application
   2. Get all applications (admin)
   3. Get logged-in student's applications
   4. Get application by ID
   5. Update application status (admin)
========================================================= */

const Application = require("../models/ApplicationModel");

/* =========================================================
   APPLICATION STATUS
========================================================= */

const APPLICATION_STATUSES = [
    "Pending",
    "Under Review",
    "Approved",
    "Rejected",
    "Completed"
];

/* =========================================================
   HELPER: Generate application ID
========================================================= */

function generateApplicationId() {
    const timestamp = Date.now().toString();
    const random = Math.floor(1000 + Math.random() * 9000);

    return `SB${timestamp}${random}`;
}

/* =========================================================
   HELPER: Get authenticated user ID
========================================================= */

function getUserId(req) {
    return req.user?._id || req.user?.id || null;
}

/* =========================================================
   1. CREATE APPLICATION

   POST /api/applications

   Requires authentication.
========================================================= */

const createApplication = async (req, res) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to submit an application."
            });
        }

        const {
            scholarshipId,
            scholarshipName,
            name,
            fullName,
            email,
            mobile,
            phone,
            category,
            course,
            institution,
            academicYear,
            familyIncome,
            address,
            purpose,
            additionalDetails,
            documentDetails,
            documents
        } = req.body;

        // Validate required fields.
        if (!scholarshipId || !scholarshipName) {
            return res.status(400).json({
                success: false,
                message: "Scholarship ID and scholarship name are required."
            });
        }

        const applicantName = fullName || name;
        const applicantMobile = mobile || phone;

        if (!applicantName || !email || !applicantMobile) {
            return res.status(400).json({
                success: false,
                message: "Name, email and mobile number are required."
            });
        }

        // Basic email validation.
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        // Validate document list.
        if (
            documents !== undefined &&
            !Array.isArray(documents)
        ) {
            return res.status(400).json({
                success: false,
                message: "Documents must be provided as an array."
            });
        }

        // Create the application.
        const application = await Application.create({
            applicationId: generateApplicationId(),

            // Student account reference.
            userId: userId,

            // Scholarship information.
            scholarshipId,
            scholarshipName,

            // Applicant information.
            name: applicantName,
            fullName: applicantName,
            email: String(email).trim().toLowerCase(),
            mobile: String(applicantMobile).trim(),

            // Academic and personal information.
            category,
            course,
            institution,
            academicYear,
            familyIncome,
            address,

            // Application details.
            purpose,
            additionalDetails,
            documentDetails,
            documents: documents || [],

            status: "Pending"
        });

        return res.status(201).json({
            success: true,
            message: "Scholarship application submitted successfully.",
            application
        });

    } catch (error) {
        console.error(
            "Create application error:",
            error.message
        );

        // Duplicate application ID.
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "A duplicate application was detected. Please try again."
            });
        }

        // Mongoose validation errors.
        if (error.name === "ValidationError") {
            return res.status(400).json({
                success: false,
                message: "Application validation failed.",
                errors: Object.values(error.errors).map(
                    item => item.message
                )
            });
        }

        return res.status(500).json({
            success: false,
            message: "Unable to submit the application.",
            error: process.env.NODE_ENV === "development"
                ? error.message
                : undefined
        });
    }
};

/* =========================================================
   2. GET ALL APPLICATIONS

   GET /api/applications

   Admin-only access must be enforced by the route middleware.
========================================================= */

const getAllApplications = async (req, res) => {
    try {
        const {
            status,
            search,
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

        if (status) {
            if (!APPLICATION_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid application status."
                });
            }

            filter.status = status;
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(
                search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
                "i"
            );

            filter.$or = [
                { applicationId: searchRegex },
                { name: searchRegex },
                { fullName: searchRegex },
                { email: searchRegex },
                { scholarshipName: searchRegex }
            ];
        }

        const skip = (pageNumber - 1) * pageSize;

        const [applications, totalApplications] =
            await Promise.all([
                Application.find(filter)
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(pageSize)
                    .lean(),

                Application.countDocuments(filter)
            ]);

        return res.status(200).json({
            success: true,
            message: "Applications retrieved successfully.",
            applications,
            pagination: {
                currentPage: pageNumber,
                pageSize,
                totalApplications,
                totalPages: Math.ceil(
                    totalApplications / pageSize
                )
            }
        });

    } catch (error) {
        console.error(
            "Get all applications error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve applications."
        });
    }
};

/* =========================================================
   3. GET MY APPLICATIONS

   GET /api/applications/my

   Returns applications belonging to the logged-in student.
========================================================= */

const getMyApplications = async (req, res) => {
    try {
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to view your applications."
            });
        }

        const applications = await Application.find({
            userId: userId
        })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            message: "Your applications retrieved successfully.",
            count: applications.length,
            applications
        });

    } catch (error) {
        console.error(
            "Get my applications error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve your applications."
        });
    }
};

/* =========================================================
   4. GET APPLICATION BY ID

   GET /api/applications/:id

   Students can access only their own applications.
   Admin access must be enforced by route middleware.
========================================================= */

const getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = getUserId(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please log in to view this application."
            });
        }

        const mongoose = require("mongoose");

        const isAdmin = req.user?.role === "admin";

        let application;

        if (mongoose.Types.ObjectId.isValid(id)) {
            application = await Application.findById(id);
        } else {
            application = await Application.findOne({
                applicationId: id
            });
        }

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }

        // Prevent students from viewing another student's application.
        if (
            !isAdmin &&
            String(application.userId) !== String(userId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this application."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Application retrieved successfully.",
            application
        });

    } catch (error) {
        console.error(
            "Get application by ID error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the application."
        });
    }
};

/* =========================================================
   5. UPDATE APPLICATION STATUS

   PUT /api/applications/:id/status

   Admin-only access must be enforced by route middleware.
========================================================= */

const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, adminRemark } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Application status is required."
            });
        }

        if (!APPLICATION_STATUSES.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status. Allowed values: " +
                    APPLICATION_STATUSES.join(", ")
            });
        }

        const mongoose = require("mongoose");

        let application;

        if (mongoose.Types.ObjectId.isValid(id)) {
            application = await Application.findById(id);
        } else {
            application = await Application.findOne({
                applicationId: id
            });
        }

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found."
            });
        }

        application.status = status;

        if (adminRemark !== undefined) {
            application.adminRemark = String(adminRemark).trim();
        }

        if (
            status === "Approved" ||
            status === "Rejected" ||
            status === "Completed"
        ) {
            application.processedAt = new Date();
        } else {
            application.processedAt = null;
        }

        await application.save();

        return res.status(200).json({
            success: true,
            message: "Application status updated successfully.",
            application
        });

    } catch (error) {
        console.error(
            "Update application status error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Unable to update application status."
        });
    }
};

/* =========================================================
   EXPORT CONTROLLERS
========================================================= */

module.exports = {
    createApplication,
    getAllApplications,
    getMyApplications,
    getApplicationById,
    updateApplicationStatus
};

