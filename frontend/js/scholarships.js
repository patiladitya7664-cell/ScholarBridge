"use strict";

/* =====================================================
   SCHOLARBRIDGE AI
   File: frontend/js/scholarships.js

   Features:
   1. Load active scholarships from the backend.
   2. Normalize API data for frontend cards.
   3. Search scholarships.
   4. Filter by category and education level.
   5. Display scholarship details.
   6. Check application deadlines.
   7. Handle loading, empty and error states.
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    // =================================================
    // 1. DOM ELEMENTS
    // =================================================

    const searchInput = document.getElementById("scholarshipSearch");
    const categoryFilter = document.getElementById("categoryFilter");
    const educationFilter = document.getElementById("educationFilter");
    const clearFiltersButton = document.getElementById("clearFilters");
    const scholarshipGrid = document.getElementById("scholarshipGrid");
    const scholarshipCount = document.getElementById("scholarshipCount");
    const emptyState = document.getElementById("emptyState");
    const emptyStateReset = document.getElementById("emptyStateReset");
    const currentYear = document.getElementById("currentYear");

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    if (!scholarshipGrid) {
        console.error(
            "ScholarBridge: Scholarship grid was not found."
        );
        return;
    }

    // =================================================
    // 2. STATE
    // =================================================

    let scholarships = [];
    let isLoadingScholarships = false;

    // =================================================
    // 3. HELPER FUNCTIONS
    // =================================================

    function escapeHTML(value) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return String(value ?? "").replace(
            /[&<>"']/g,
            character => entities[character]
        );
    }

    function parseDate(dateValue) {
        if (!dateValue) {
            return null;
        }

        // Handles ISO strings and ordinary date values.
        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return date;
    }

    function formatDate(dateValue) {
        const date = parseDate(dateValue);

        if (!date) {
            return "Not specified";
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: "UTC"
        });
    }

    function getDaysRemaining(deadline) {
        const date = parseDate(deadline);

        if (!date) {
            return null;
        }

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const lastDate = new Date(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate()
        );

        return Math.round(
            (lastDate.getTime() - today.getTime()) /
            (24 * 60 * 60 * 1000)
        );
    }

    function formatCategory(category) {
        const labels = {
            merit: "Merit-Based",
            "merit-based": "Merit-Based",
            need: "Need-Based",
            "need-based": "Need-Based",
            government: "Government",
            govt: "Government",
            private: "Private",
            minority: "Minority"
        };

        const key = String(category || "")
            .trim()
            .toLowerCase();

        return labels[key] || (
            key
                ? key.replace(/[-_]/g, " ").replace(/\b\w/g, char => char.toUpperCase())
                : "Scholarship"
        );
    }

    function formatEducation(education) {
        const labels = {
            school: "School",
            "school-level": "School",
            undergraduate: "Undergraduate",
            "under graduate": "Undergraduate",
            ug: "Undergraduate",
            postgraduate: "Postgraduate",
            "post graduate": "Postgraduate",
            pg: "Postgraduate",
            doctoral: "Doctoral",
            doctorate: "Doctoral",
            phd: "Doctoral",
            all: "All Levels"
        };

        const key = String(education || "")
            .trim()
            .toLowerCase();

        return labels[key] || (
            key
                ? key.replace(/[-_]/g, " ").replace(/\b\w/g, char => char.toUpperCase())
                : "All Levels"
        );
    }

    function formatAmount(item) {
        const value = item.amount ?? item.awardAmount;

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return "Amount not specified";
        }

        const amount = Number(value);

        if (!Number.isFinite(amount)) {
            return "Amount not specified";
        }

        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(amount);
    }

    // =================================================
    // 4. NORMALIZE BACKEND DATA
    // =================================================

    function normalizeScholarship(item) {
        const category = String(
            item.category || "other"
        ).trim().toLowerCase();

        const education = String(
            item.educationLevel || "all"
        ).trim().toLowerCase();

        return {
            id: String(
                item.scholarshipId ||
                item._id ||
                item.id ||
                ""
            ),

            name: String(
                item.title ||
                item.name ||
                "Untitled Scholarship"
            ),

            provider: String(
                item.provider ||
                item.organization ||
                "Provider not specified"
            ),

            category,
            education,

            amount: formatAmount(item),

            deadline: item.deadline || null,

            eligibility: String(
                item.eligibility ||
                item.eligibilityCriteria ||
                "Please check the official eligibility requirements."
            ),

            description: String(
                item.description ||
                "Scholarship description is not available."
            ),

            applicationUrl: String(
                item.applicationUrl ||
                item.website ||
                ""
            ),

            requiredDocuments: Array.isArray(item.requiredDocuments)
                ? item.requiredDocuments
                : [],

            status: String(item.status || "Active"),

            icon: "fa-award"
        };
    }

    // =================================================
    // 5. FILTER SCHOLARSHIPS
    // =================================================

    function getFilteredScholarships() {
        const searchTerm = (
            searchInput?.value || ""
        ).trim().toLowerCase();

        const selectedCategory = (
            categoryFilter?.value || "all"
        ).trim().toLowerCase();

        const selectedEducation = (
            educationFilter?.value || "all"
        ).trim().toLowerCase();

        return scholarships.filter(scholarship => {

            const searchableText = [
                scholarship.name,
                scholarship.provider,
                scholarship.description,
                scholarship.eligibility,
                scholarship.category,
                scholarship.education
            ].join(" ").toLowerCase();

            const matchesSearch =
                searchableText.includes(searchTerm);

            const matchesCategory =
                selectedCategory === "all" ||
                scholarship.category === selectedCategory;

            const matchesEducation =
                selectedEducation === "all" ||
                scholarship.education === selectedEducation;

            return (
                matchesSearch &&
                matchesCategory &&
                matchesEducation
            );
        });
    }

    // =================================================
    // 6. EMPTY STATE
    // =================================================

    function showEmptyState(title, message) {
        if (!emptyState) {
            return;
        }

        emptyState.hidden = false;

        const heading = emptyState.querySelector("h3");
        const paragraph = emptyState.querySelector("p");

        if (heading) {
            heading.textContent = title;
        }

        if (paragraph) {
            paragraph.textContent = message;
        }
    }

    function hideEmptyState() {
        if (emptyState) {
            emptyState.hidden = true;
        }
    }

    // =================================================
    // 7. CREATE SCHOLARSHIP CARD
    // =================================================

    function createScholarshipCard(scholarship) {
        const daysRemaining = getDaysRemaining(
            scholarship.deadline
        );

        let deadlineText = "Deadline not specified";

        if (daysRemaining !== null) {
            if (daysRemaining < 0) {
                deadlineText = "Deadline passed";
            } else if (daysRemaining === 0) {
                deadlineText = "Deadline is today";
            } else {
                deadlineText = `${daysRemaining} days remaining`;
            }
        }

        const deadlineClass =
            daysRemaining !== null && daysRemaining < 0
                ? "deadline-expired"
                : "";

        const canApply =
            daysRemaining === null || daysRemaining >= 0;

        return `
            <article class="scholarship-card">

                <div class="scholarship-card-top">

                    <div class="scholarship-icon">
                        <i class="fa-solid ${escapeHTML(scholarship.icon)}"></i>
                    </div>

                    <span class="scholarship-category">
                        ${escapeHTML(formatCategory(scholarship.category))}
                    </span>

                </div>

                <h3>${escapeHTML(scholarship.name)}</h3>

                <p class="scholarship-provider">
                    <i class="fa-regular fa-building"></i>
                    ${escapeHTML(scholarship.provider)}
                </p>

                <p class="scholarship-amount">
                    ${escapeHTML(scholarship.amount)}
                </p>

                <div class="scholarship-details">

                    <div class="scholarship-detail">
                        <i class="fa-solid fa-graduation-cap"></i>
                        <span>
                            ${escapeHTML(formatEducation(scholarship.education))}
                        </span>
                    </div>

                    <div class="scholarship-detail">
                        <i class="fa-regular fa-calendar"></i>
                        <span>
                            Deadline: ${escapeHTML(formatDate(scholarship.deadline))}
                        </span>
                    </div>

                    <div class="scholarship-detail ${deadlineClass}">
                        <i class="fa-solid fa-clock"></i>
                        <span>${escapeHTML(deadlineText)}</span>
                    </div>

                </div>

                <p class="scholarship-description">
                    ${escapeHTML(scholarship.description)}
                </p>

                <div class="scholarship-actions">

                    <button
                        type="button"
                        class="details-button"
                        data-action="details"
                        data-id="${escapeHTML(scholarship.id)}">

                        <i class="fa-regular fa-eye"></i>
                        Details
                    </button>

                    ${
                        canApply
                            ? `
                                <button
                                    type="button"
                                    class="apply-button"
                                    data-action="apply"
                                    data-id="${escapeHTML(scholarship.id)}">

                                    <i class="fa-solid fa-arrow-right"></i>
                                    Apply Now
                                </button>
                            `
                            : `
                                <button
                                    type="button"
                                    class="apply-button"
                                    disabled>

                                    Deadline Passed
                                </button>
                            `
                    }

                </div>

            </article>
        `;
    }

    // =================================================
    // 8. RENDER SCHOLARSHIPS
    // =================================================

    function renderScholarships() {
        if (isLoadingScholarships) {
            return;
        }

        const filteredScholarships =
            getFilteredScholarships();

        scholarshipGrid.innerHTML = "";

        if (scholarshipCount) {
            scholarshipCount.textContent =
                `${filteredScholarships.length} Scholarships`;
        }

        if (filteredScholarships.length === 0) {
            showEmptyState(
                scholarships.length === 0
                    ? "No Scholarships Available"
                    : "No Matching Scholarships",
                scholarships.length === 0
                    ? "No active scholarships are currently listed. Please check again later."
                    : "Try changing your search or filters to find scholarships."
            );

            return;
        }

        hideEmptyState();

        scholarshipGrid.innerHTML = filteredScholarships
            .map(createScholarshipCard)
            .join("");
    }

    // =================================================
    // 9. LOAD SCHOLARSHIPS FROM BACKEND
    // =================================================

    async function loadScholarships() {
        if (isLoadingScholarships) {
            return;
        }

        isLoadingScholarships = true;

        scholarshipGrid.innerHTML = "";

        if (scholarshipCount) {
            scholarshipCount.textContent =
                "Loading scholarships...";
        }

        showEmptyState(
            "Loading Scholarships...",
            "Please wait while we retrieve available scholarships."
        );

        try {
            if (typeof apiGet !== "function") {
                throw new Error(
                    "API service is unavailable. Check scholarships.html script imports."
                );
            }

            const response = await apiGet(
                "/scholarships?status=Active&limit=100"
            );

            if (
                !response ||
                response.success !== true ||
                !Array.isArray(response.scholarships)
            ) {
                throw new Error(
                    response?.message ||
                    "The server returned an invalid scholarship response."
                );
            }

            scholarships = response.scholarships
                .map(normalizeScholarship)
                .filter(scholarship => (
                    scholarship.id && scholarship.name
                ));

            console.log(
                "ScholarBridge: Loaded active scholarships:",
                scholarships.length
            );

        } catch (error) {
            console.error(
                "ScholarBridge: Failed to load scholarships:",
                error
            );

            scholarships = [];

            scholarshipGrid.innerHTML = "";

            if (scholarshipCount) {
                scholarshipCount.textContent =
                    "Scholarships unavailable";
            }

            showEmptyState(
                "Unable to Load Scholarships",
                error.message ||
                "Please check your connection and try again."
            );

        } finally {
            isLoadingScholarships = false;
        }

        // Render only after loading has completed.
        if (scholarshipCount?.textContent !== "Scholarships unavailable") {
            renderScholarships();
        }
    }

    // =================================================
    // 10. CLEAR FILTERS
    // =================================================

    function clearFilters() {
        if (searchInput) {
            searchInput.value = "";
        }

        if (categoryFilter) {
            categoryFilter.value = "all";
        }

        if (educationFilter) {
            educationFilter.value = "all";
        }

        renderScholarships();
    }

    // =================================================
    // 11. SCHOLARSHIP DETAILS
    // =================================================

    function showScholarshipDetails(scholarship) {
        const details = [
            scholarship.name,
            "",
            `Provider: ${scholarship.provider}`,
            `Award: ${scholarship.amount}`,
            `Category: ${formatCategory(scholarship.category)}`,
            `Education: ${formatEducation(scholarship.education)}`,
            `Deadline: ${formatDate(scholarship.deadline)}`,
            "",
            `Eligibility: ${scholarship.eligibility}`,
            "",
            scholarship.description,
            "",
            scholarship.applicationUrl
                ? `Official application website: ${scholarship.applicationUrl}`
                : "Official application website not provided."
        ].join("\n");

        window.alert(details);
    }

    
// ================================================
// APPLY FOR SCHOLARSHIP
// ================================================

function applyForScholarship(scholarship) {
    if (!scholarship || !scholarship.id) {
        alert("Scholarship information is missing.");
        return;
    }

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("scholarBridgeToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwtToken");

    if (!token) {
        const shouldLogin = confirm(
            "Please log in before applying for a scholarship."
        );

        if (shouldLogin) {
            window.location.href =
                "login.html?redirect=" +
                encodeURIComponent(
                    "apply.html?id=" + scholarship.id
                );
        }

        return;
    }

    const daysRemaining = getDaysRemaining(scholarship.deadline);

    if (daysRemaining !== null && daysRemaining < 0) {
        alert("The deadline for this scholarship has passed.");
        return;
    }

    window.location.href =
        "apply.html?id=" +
        encodeURIComponent(scholarship.id);
}


    // =================================================
    // 13. EVENT LISTENERS
    // =================================================

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderScholarships
        );
    }

    if (categoryFilter) {
        categoryFilter.addEventListener(
            "change",
            renderScholarships
        );
    }

    if (educationFilter) {
        educationFilter.addEventListener(
            "change",
            renderScholarships
        );
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener(
            "click",
            clearFilters
        );
    }

    if (emptyStateReset) {
        emptyStateReset.addEventListener(
            "click",
            clearFilters
        );
    }

    scholarshipGrid.addEventListener("click", event => {
        const button = event.target.closest(
            "button[data-action]"
        );

        if (!button || button.disabled) {
            return;
        }

        const scholarship = scholarships.find(
            item => item.id === button.dataset.id
        );

        if (!scholarship) {
            return;
        }

        if (button.dataset.action === "details") {
            showScholarshipDetails(scholarship);
        }

        if (button.dataset.action === "apply") {
            applyForScholarship(scholarship);
        }
    });

    // =================================================
    // 14. INITIALIZE PAGE
    // =================================================

    loadScholarships();

    console.log(
        "ScholarBridge AI: Scholarships page initialized."
    );

});
