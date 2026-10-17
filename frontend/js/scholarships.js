/* =====================================================
   SCHOLARBRIDGE - SCHOLARSHIPS PAGE
   Frontend JavaScript
===================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    // ================================================
    // 1. DOM ELEMENTS
    // ================================================

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
        console.error("ScholarBridge: Scholarship grid not found.");
        return;
    }

    // ================================================
    // 2. DEMO SCHOLARSHIP DATA
    // Frontend demo data. Backend integration later.
    // Verify eligibility and deadlines before applying.
    // ================================================

    const scholarships = [
        {
            id: "SB001",
            name: "National Merit Scholarship",
            provider: "ScholarBridge Demo Listing",
            category: "merit",
            education: "undergraduate",
            amount: "₹10,000",
            deadline: "2027-03-31",
            eligibility: "Students with strong academic performance.",
            description: "A demonstration listing for students exploring merit-based financial support.",
            icon: "fa-award"
        },
        {
            id: "SB002",
            name: "Student Financial Support",
            provider: "ScholarBridge Demo Listing",
            category: "need",
            education: "undergraduate",
            amount: "₹15,000",
            deadline: "2027-04-15",
            eligibility: "Students who need financial assistance for education.",
            description: "A demonstration listing focused on educational financial assistance.",
            icon: "fa-hand-holding-heart"
        },
        {
            id: "SB003",
            name: "School Education Scholarship",
            provider: "ScholarBridge Demo Listing",
            category: "government",
            education: "school",
            amount: "₹5,000",
            deadline: "2027-02-28",
            eligibility: "School students meeting the relevant scheme requirements.",
            description: "A sample opportunity for students continuing their school education.",
            icon: "fa-school"
        },
        {
            id: "SB004",
            name: "Private Excellence Award",
            provider: "ScholarBridge Demo Listing",
            category: "private",
            education: "undergraduate",
            amount: "₹20,000",
            deadline: "2027-05-20",
            eligibility: "Undergraduate students who meet the award criteria.",
            description: "A demonstration listing for a private educational award.",
            icon: "fa-star"
        },
        {
            id: "SB005",
            name: "Postgraduate Research Support",
            provider: "ScholarBridge Demo Listing",
            category: "merit",
            education: "postgraduate",
            amount: "₹25,000",
            deadline: "2027-06-15",
            eligibility: "Postgraduate students pursuing further study or research.",
            description: "A sample listing for postgraduate students.",
            icon: "fa-book-open"
        },
        {
            id: "SB006",
            name: "Inclusive Education Support",
            provider: "ScholarBridge Demo Listing",
            category: "minority",
            education: "undergraduate",
            amount: "₹12,000",
            deadline: "2027-04-30",
            eligibility: "Students who meet the applicable scheme eligibility criteria.",
            description: "A demonstration listing for an inclusive education support program.",
            icon: "fa-people-group"
        },
        {
            id: "SB007",
            name: "Doctoral Research Grant",
            provider: "ScholarBridge Demo Listing",
            category: "merit",
            education: "doctoral",
            amount: "₹30,000",
            deadline: "2027-07-15",
            eligibility: "Doctoral students meeting the relevant grant criteria.",
            description: "A sample listing for students pursuing doctoral research.",
            icon: "fa-flask"
        },
        {
            id: "SB008",
            name: "Higher Education Assistance",
            provider: "ScholarBridge Demo Listing",
            category: "government",
            education: "postgraduate",
            amount: "₹18,000",
            deadline: "2027-05-10",
            eligibility: "Postgraduate students meeting the applicable requirements.",
            description: "A demonstration listing for higher education assistance.",
            icon: "fa-graduation-cap"
        },
        {
            id: "SB009",
            name: "School Achievement Award",
            provider: "ScholarBridge Demo Listing",
            category: "private",
            education: "school",
            amount: "₹7,500",
            deadline: "2027-03-15",
            eligibility: "School students who satisfy the award criteria.",
            description: "A sample award for students demonstrating academic achievement.",
            icon: "fa-medal"
        }
    ];

    // ================================================
    // 3. HELPER FUNCTIONS
    // ================================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
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

    function formatDate(dateString) {
        if (!dateString) {
            return "Not specified";
        }

        const date = new Date(`${dateString}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return "Not specified";
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    }

    function formatCategory(category) {
        const labels = {
            merit: "Merit-Based",
            need: "Need-Based",
            government: "Government",
            private: "Private",
            minority: "Minority"
        };

        return labels[category] || "Scholarship";
    }

    function formatEducation(education) {
        const labels = {
            school: "School",
            undergraduate: "Undergraduate",
            postgraduate: "Postgraduate",
            doctoral: "Doctoral"
        };

        return labels[education] || "All Levels";
    }

    function getDaysRemaining(deadline) {
        if (!deadline) {
            return null;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastDate = new Date(`${deadline}T00:00:00`);

        if (Number.isNaN(lastDate.getTime())) {
            return null;
        }

        return Math.ceil(
            (lastDate.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        );
    }

    // ================================================
    // 4. FILTER SCHOLARSHIPS
    // ================================================

    function getFilteredScholarships() {
        const searchTerm = (searchInput?.value || "")
            .trim()
            .toLowerCase();

        const selectedCategory = categoryFilter?.value || "all";
        const selectedEducation = educationFilter?.value || "all";

        return scholarships.filter(scholarship => {

            const searchableText = [
                scholarship.name,
                scholarship.provider,
                scholarship.description,
                scholarship.eligibility,
                scholarship.category,
                scholarship.education
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);

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

    // ================================================
    // 5. CREATE SCHOLARSHIP CARD
    // ================================================

    function createScholarshipCard(scholarship) {
        const daysRemaining = getDaysRemaining(scholarship.deadline);

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

        const canApply = daysRemaining === null || daysRemaining >= 0;

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

    // ================================================
    // 6. DISPLAY SCHOLARSHIPS
    // ================================================

    function renderScholarships() {
        const filteredScholarships = getFilteredScholarships();

        scholarshipGrid.innerHTML = "";

        if (scholarshipCount) {
            scholarshipCount.textContent =
                `${filteredScholarships.length} Scholarships`;
        }

        if (filteredScholarships.length === 0) {
            if (emptyState) {
                emptyState.hidden = false;
            }

            return;
        }

        if (emptyState) {
            emptyState.hidden = true;
        }

        scholarshipGrid.innerHTML = filteredScholarships
            .map(createScholarshipCard)
            .join("");
    }

    // ================================================
    // 7. CLEAR FILTERS
    // ================================================

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

    // ================================================
    // 8. SCHOLARSHIP DETAILS
    // ================================================

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
            "This is demonstration content. Verify the official scholarship details before applying."
        ].join("\n");

        window.alert(details);
    }

    // ================================================
    // 9. APPLY NOW
    // ================================================

    function applyForScholarship(scholarship) {
        const token =
            localStorage.getItem("token") ||
            localStorage.getItem("scholarBridgeToken") ||
            localStorage.getItem("scholarSetuToken");

        if (!token) {
            const shouldLogin = window.confirm(
                "Please log in to continue with your application. Open the login page?"
            );

            if (shouldLogin) {
                window.location.href = "login.html";
            }

            return;
        }

        const daysRemaining = getDaysRemaining(scholarship.deadline);

        if (daysRemaining !== null && daysRemaining < 0) {
            window.alert("The deadline for this scholarship has passed.");
            return;
        }

        window.alert(
            "ScholarBridge application system\n\n" +
            `Scholarship: ${scholarship.name}\n\n` +
            "The application submission feature will be connected when the backend is ready."
        );
    }

    // ================================================
    // 10. EVENT LISTENERS
    // ================================================

    if (searchInput) {
        searchInput.addEventListener("input", renderScholarships);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", renderScholarships);
    }

    if (educationFilter) {
        educationFilter.addEventListener("change", renderScholarships);
    }

    if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", clearFilters);
    }

    if (emptyStateReset) {
        emptyStateReset.addEventListener("click", clearFilters);
    }

    scholarshipGrid.addEventListener("click", event => {
        const button = event.target.closest("button[data-action]");

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

    // ================================================
    // 11. INITIALIZE PAGE
    // ================================================

    renderScholarships();

    console.log("ScholarBridge scholarships page initialized.");
});