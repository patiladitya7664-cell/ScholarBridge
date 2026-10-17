"use strict";

/* =========================================================
ScholarBridge AI
File: backend/routes/scholarshipRoutes.js

Features:

1. Get all scholarships
2. Search and filter scholarships
3. Get scholarship details
4. Create scholarship (Admin)
5. Update scholarship (Admin)
6. Delete scholarship (Admin)
   ========================================================= */

const express = require("express");
const router = express.Router();

const {
getAllScholarships,
getScholarshipById,
createScholarship,
updateScholarship,
deleteScholarship
} = require("../controllers/scholarshipController");

const {
protect,
authorizeRoles
} = require("../middleware/authMiddleware");

// Create admin-only authorization middleware.
const adminOnly = authorizeRoles("admin");

/* =========================================================
PUBLIC ROUTES
========================================================= */

// GET /api/scholarships
// Get all scholarships, including search and filters.
router.get(
"/",
getAllScholarships
);

// GET /api/scholarships/:id
// Get scholarship details by MongoDB ID or scholarship ID.
router.get(
"/:id",
getScholarshipById
);

/* =========================================================
ADMIN-ONLY ROUTES
========================================================= */

// POST /api/scholarships
// Create a new scholarship.
router.post(
"/",
protect,
adminOnly,
createScholarship
);

// PUT /api/scholarships/:id
// Update an existing scholarship.
router.put(
"/:id",
protect,
adminOnly,
updateScholarship
);

// DELETE /api/scholarships/:id
// Delete a scholarship.
router.delete(
"/:id",
protect,
adminOnly,
deleteScholarship
);

/* =========================================================
EXPORT ROUTER
========================================================= */

module.exports = router;
