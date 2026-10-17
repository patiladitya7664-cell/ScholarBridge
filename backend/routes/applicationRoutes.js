"use strict";

/* =========================================================
ScholarBridge AI
File: backend/routes/applicationRoutes.js

Purpose:

* Define scholarship application API routes
* Protect routes using authentication middleware
* Restrict administrative operations to admins
  ========================================================= */

const express = require("express");
const router = express.Router();

const {
createApplication,
getAllApplications,
getMyApplications,
getApplicationById,
updateApplicationStatus
} = require("../controllers/applicationController");

const {
protect,
authorizeRoles
} = require("../middleware/authMiddleware");

// Create admin-only authorization middleware.
const adminOnly = authorizeRoles("admin");

/* =========================================================
APPLICATION ROUTES
========================================================= */

// Submit a new scholarship application.
router.post(
"/",
protect,
createApplication
);

// Get the logged-in student's applications.
// Keep this route above "/:id".
router.get(
"/my",
protect,
getMyApplications
);

// Get all applications (admin only).
router.get(
"/",
protect,
adminOnly,
getAllApplications
);

// Update an application's status (admin only).
router.put(
"/:id/status",
protect,
adminOnly,
updateApplicationStatus
);

// Get an individual application.
router.get(
"/:id",
protect,
getApplicationById
);

module.exports = router;
