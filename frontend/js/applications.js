
"use strict";

/* =========================================================
   SCHOLARBRIDGE AI — MY APPLICATIONS
   File: frontend/js/applications.js
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    // -----------------------------------------------------
    // DOM ELEMENTS
    // -----------------------------------------------------

    const applicationsList = document.getElementById("applicationsList");
    const emptyState = document.getElementById("applicationsEmptyState");

    const totalApplications = document.getElementById("totalApplications");
    const pendingApplications = document.getElementById("pendingApplications");
    const approvedApplications = document.getElementById("approvedApplications");
    const rejectedApplications = document.getElementById("rejectedApplications");

    const applicationCount = document.getElementById("applicationCount");
    const applicationSearch = document.getElementById("applicationSearch");
    const statusFilter = document.getElementById("statusFilter");
    const resetFilters = document.getElementById("resetApplicationFilters");
    const currentYear = document.getElementById("currentYear");

    // -----------------------------------------------------
    // INITIAL SETUP
    // -----------------------------------------------------

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    if (!applicationsList) {
        console.error(
            "ScholarBridge: #applicationsList was not found in applications.html"
        );
        return;
    }

    /*
     * Backend integration will be added in the next step.
     *
     * For now, the page starts with an empty application list.
     * This prevents demo applications from being mistaken
     * for real scholarship applications.
     */

    let applications = [];

    // -----------------------------------------------------
    // HELPERS
    // -----------------------------------------------------

    function normalizeStatus(status) {
        const value = String(status || "")
            .trim()
            .toLowerCase()
            .replace(/[_\s]+/g, "-");

        const statusMap = {
            pending: "pending",
            submitted: "pending",
            "application-submitted": "pending",

            approved: "approved",
            accepted: "approved",
            successful: "approved",

            rejected: "rejected",
            declined: "rejected",

            "under-review": "under-review",
            reviewing: "under-review",
            "in-review": "under-review",
            processing: "under-review"
        };

        return statusMap[value] || "pending";
    }

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
    }

    function formatDate(value) {
        if (!value) {
            return "Not available";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "Not available";
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function getScholarshipName(application) {
        const scholarship = application.scholarship;

        if (typeof scholarship === "string") {
            return scholarship;
        }

        return (
            application.scholarshipName ||
            application.name ||
            scholarship?.title ||
            scholarship?.name ||
            "Scholarship Application"
        );
    }

    function getOrganization(application) {
        const scholarship = application.scholarship;

        if (typeof scholarship === "object" && scholarship !== null) {
            return (
                application.organization ||
                scholarship.provider ||
                scholarship.organization ||
                scholarship.department ||
                "Scholarship Provider"
            );
        }

        return (
            application.organization ||
            application.provider ||
            "Scholarship Provider"
        );
    }

    function getApplicationDate(application) {
        return (
            application.appliedAt ||
            application.applicationDate ||
            application.createdAt ||
            application.submittedAt ||
            null
        );
    }

    function getApplicationId(application) {
        return (
            application._id ||
            application.id ||
            application.applicationId ||
            ""
        );
    }

    // -----------------------------------------------------
    // APPLICATION STATISTICS
    // -----------------------------------------------------

    function updateStatistics() {
        const total = applications.length;

        const pending = applications.filter(
            (application) =>
                normalizeStatus(application.status) === "pending"
        ).length;

        const approved = applications.filter(
            (application) =>
                normalizeStatus(application.status) === "approved"
        ).length;

        const rejected = applications.filter(
            (application) =>
                normalizeStatus(application.status) === "rejected"
        ).length;

        if (totalApplications) {
            totalApplications.textContent = total;
        }

        if (pendingApplications) {
            pendingApplications.textContent = pending;
        }

        if (approvedApplications) {
            approvedApplications.textContent = approved;
        }

        if (rejectedApplications) {
            rejectedApplications.textContent = rejected;
        }
    }

    // -----------------------------------------------------
    // STATUS BADGE
    // -----------------------------------------------------

    function getStatusBadge(status) {
        const normalizedStatus = normalizeStatus(status);

        const statusDetails = {
            pending: {
                label: "Pending",
                icon: "fa-clock",
                className: "pending"
            },

            approved: {
                label: "Approved",
                icon: "fa-circle-check",
                className: "approved"
            },

            rejected: {
                label: "Rejected",
                icon: "fa-circle-xmark",
                className: "rejected"
            },

            "under-review": {
                label: "Under Review",
                icon: "fa-magnifying-glass",
                className: "under-review"
            }
        };

        const details = statusDetails[normalizedStatus];

        return `
            <span class="application-status status-${details.className}">
                <i class="fa-solid ${details.icon}" aria-hidden="true"></i>
                ${details.label}
            </span>
        `;
    }

    // -----------------------------------------------------
    // APPLICATION CARD
    // -----------------------------------------------------

    function createApplicationCard(application) {
        const scholarshipName = escapeHTML(
            getScholarshipName(application)
        );

        const organization = escapeHTML(
            getOrganization(application)
        );

        const applicationDate = escapeHTML(
            formatDate(getApplicationDate(application))
        );

        const status = normalizeStatus(application.status);

        const applicationId = escapeHTML(
            getApplicationId(application)
        );

        const amountValue =
            application.amount ??
            application.scholarship?.amount ??
            application.awardAmount;

        const amount = Number(amountValue);

        const hasAmount =
            amountValue !== null &&
            amountValue !== undefined &&
            amountValue !== "" &&
            Number.isFinite(amount) &&
            amount >= 0;

        const amountHTML = hasAmount
            ? `
                <div class="application-detail">
                    <i class="fa-solid fa-indian-rupee-sign"
                       aria-hidden="true"></i>
                    <span>
                        ${escapeHTML(
                            amount.toLocaleString("en-IN")
                        )}
                    </span>
                </div>
              `
            : "";

        const idHTML = applicationId
            ? `
                <div class="application-detail">
                    <i class="fa-solid fa-hashtag"
                       aria-hidden="true"></i>
                    <span>${applicationId}</span>
                </div>
              `
            : "";

        return `
            <article class="application-card"
                     data-application-id="${applicationId}">

                <div class="application-card-header">

                    <div class="application-card-icon">
                        <i class="fa-solid fa-graduation-cap"
                           aria-hidden="true"></i>
                    </div>

                    <div class="application-card-title">
                        <h3>${scholarshipName}</h3>
                        <p>${organization}</p>
                    </div>

                    ${getStatusBadge(status)}

                </div>

                <div class="application-card-details">

                    <div class="application-detail">
                        <i class="fa-regular fa-calendar"
                           aria-hidden="true"></i>
                        <span>Applied: ${applicationDate}</span>
                    </div>

                    ${idHTML}
                    ${amountHTML}

                </div>

            </article>
        `;
    }

    // -----------------------------------------------------
    // FILTER APPLICATIONS
    // -----------------------------------------------------

    function getFilteredApplications() {
        const searchTerm = (
            applicationSearch?.value || ""
        ).trim().toLowerCase();

        const selectedStatus = statusFilter?.value || "all";

        return applications.filter((application) => {
            const scholarshipName = getScholarshipName(application);
            const organization = getOrganization(application);
            const id = getApplicationId(application);

            const searchableText = [
                scholarshipName,
                organization,
                id,
                application.status
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch =
                searchableText.includes(searchTerm);

            const matchesStatus =
                selectedStatus === "all" ||
                normalizeStatus(application.status) === selectedStatus;

            return matchesSearch && matchesStatus;
        });
    }

    // -----------------------------------------------------
    // EMPTY STATE
    // -----------------------------------------------------

    function showEmptyState(message, description) {
        applicationsList.innerHTML = "";

        if (emptyState) {
            emptyState.hidden = false;

            const heading = emptyState.querySelector("h3");
            const paragraph = emptyState.querySelector("p");

            if (heading) {
                heading.textContent = message;
            }

            if (paragraph) {
                paragraph.textContent = description;
            }
        } else {
            applicationsList.innerHTML = `
                <div class="applications-empty">
                    <h3>${escapeHTML(message)}</h3>
                    <p>${escapeHTML(description)}</p>
                </div>
            `;
        }
    }

    // -----------------------------------------------------
    // RENDER APPLICATIONS
    // -----------------------------------------------------

    function renderApplications() {
        updateStatistics();

        const filteredApplications = getFilteredApplications();

        if (applicationCount) {
            applicationCount.textContent =
                `${filteredApplications.length} ${
                    filteredApplications.length === 1
                        ? "application"
                        : "applications"
                }`;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }

        if (applications.length === 0) {
            showEmptyState(
                "No Applications Yet",
                "Your scholarship applications will appear here after you apply."
            );

            return;
        }

        if (filteredApplications.length === 0) {
            showEmptyState(
                "No Matching Applications",
                "Try another search term or change the selected status filter."
            );

            return;
        }

        applicationsList.innerHTML = filteredApplications
            .map(createApplicationCard)
            .join("");
    }

    // -----------------------------------------------------
    // RESET FILTERS
    // -----------------------------------------------------

    function resetApplicationFilters() {
        if (applicationSearch) {
            applicationSearch.value = "";
        }

        if (statusFilter) {
            statusFilter.value = "all";
        }

        renderApplications();
    }

    // -----------------------------------------------------
    // EVENT LISTENERS
    // -----------------------------------------------------

    if (applicationSearch) {
        applicationSearch.addEventListener(
            "input",
            renderApplications
        );
    }

    if (statusFilter) {
        statusFilter.addEventListener(
            "change",
            renderApplications
        );
    }

    if (resetFilters) {
        resetFilters.addEventListener(
            "click",
            resetApplicationFilters
        );
    }

       // -----------------------------------------------------
    // LOAD APPLICATIONS FROM BACKEND
    // -----------------------------------------------------

    async function loadMyApplications() {
        // Clear previous application data before loading.
        applications = [];

        // Check whether the user is logged in.
        const token =
            typeof getApiToken === "function"
                ? getApiToken()
                : (
                    localStorage.getItem("token") ||
                    localStorage.getItem("scholarBridgeToken") ||
                    ""
                );

        if (!token) {
            updateStatistics();

            showEmptyState(
                "Login Required",
                "Please log in to view and track your scholarship applications."
            );

            if (applicationCount) {
                applicationCount.textContent = "0 applications";
            }

            return;
        }

        // Show a loading message while the API request is running.
        if (emptyState) {
            emptyState.hidden = false;

            const heading = emptyState.querySelector("h3");
            const paragraph = emptyState.querySelector("p");

            if (heading) {
                heading.textContent = "Loading Applications...";
            }

            if (paragraph) {
                paragraph.textContent =
                    "Please wait while we retrieve your applications.";
            }
        }

        applicationsList.innerHTML = "";

        try {
            // Request only the logged-in student's applications.
            if (typeof apiGet !== "function") {
                throw new Error(
                    "API service is unavailable. Please check applications.html script imports."
                );
            }

            const response = await apiGet("/applications/my");

            if (!response || response.success !== true) {
                throw new Error(
                    response?.message ||
                    "Unable to retrieve your applications."
                );
            }

            // Never display non-array API data as applications.
            if (!Array.isArray(response.applications)) {
                throw new Error(
                    "The server returned an invalid applications response."
                );
            }

            // Save real records and refresh the interface.
            applications = response.applications;

            renderApplications();

            console.log(
                "ScholarBridge: Applications loaded successfully.",
                applications.length
            );

        } catch (error) {
            console.error(
                "ScholarBridge: Failed to load applications:",
                error
            );

            updateStatistics();

            if (applicationCount) {
                applicationCount.textContent = "Applications unavailable";
            }

            showEmptyState(
                "Unable to Load Applications",
                error.message ||
                "Please check your connection and try again."
            );
        }
    }

    // -----------------------------------------------------
    // INITIALIZE APPLICATIONS PAGE
    // -----------------------------------------------------

    renderApplications();

    loadMyApplications();

});