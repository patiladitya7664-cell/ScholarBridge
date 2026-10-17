/* =========================================================
   SCHOLARBRIDGE - SCHOLARSHIP DEADLINES
   File: deadlines.js

   Features:
   1. Deadline cards
   2. Search scholarships
   3. Filter by deadline status
   4. Sort by deadline or name
   5. Deadline statistics
   6. Remaining days calculation
   7. Empty state
   8. Responsive rendering

   IMPORTANT:
   The listings below are DEMO DATA.
   Verify actual deadlines on official websites.
   Backend integration will be added later.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =====================================================
    // 1. DOM ELEMENTS
    // =====================================================

    const deadlinesList = document.getElementById("deadlinesList");
    const deadlineCount = document.getElementById("deadlineCount");

    const totalDeadlinesElement = document.getElementById("totalDeadlines");
    const upcomingDeadlinesElement = document.getElementById("upcomingDeadlines");
    const urgentDeadlinesElement = document.getElementById("urgentDeadlines");
    const expiredDeadlinesElement = document.getElementById("expiredDeadlines");

    const deadlineSearch = document.getElementById("deadlineSearch");
    const deadlineView = document.getElementById("deadlineView");
    const deadlineSort = document.getElementById("deadlineSort");

    const resetDeadlineFilters = document.getElementById(
        "resetDeadlineFilters"
    );

    const emptyStateReset = document.getElementById("emptyStateReset");
    const deadlinesEmptyState = document.getElementById(
        "deadlinesEmptyState"
    );

    const currentYear = document.getElementById("currentYear");

    // =====================================================
    // 2. CURRENT YEAR
    // =====================================================

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // =====================================================
    // 3. DEMO DEADLINE DATA
    // =====================================================
    // These are sample records for UI testing, not verified
    // scholarship announcements or official deadlines.

    const demoDeadlines = [
        {
            id: "SB-DL-DEMO-001",
            name: "National Scholarship Programme",
            provider: "Demo Listing",
            category: "Government",
            amount: 25000,
            deadline: "2026-10-20",
            description:
                "Sample government scholarship deadline for demonstrating the interface."
        },
        {
            id: "SB-DL-DEMO-002",
            name: "Merit-Based Education Scholarship",
            provider: "Demo Listing",
            category: "Merit-Based",
            amount: 15000,
            deadline: "2026-10-24",
            description:
                "Sample merit-based scholarship deadline. Verify official details before applying."
        },
        {
            id: "SB-DL-DEMO-003",
            name: "Higher Education Support Grant",
            provider: "Demo Listing",
            category: "Education",
            amount: 30000,
            deadline: "2026-11-15",
            description:
                "Sample education support grant for the frontend preview."
        },
        {
            id: "SB-DL-DEMO-004",
            name: "Student Achievement Award",
            provider: "Demo Listing",
            category: "Merit-Based",
            amount: 10000,
            deadline: "2026-12-10",
            description:
                "Sample scholarship listing. This is not an official announcement."
        },
        {
            id: "SB-DL-DEMO-005",
            name: "Academic Excellence Grant",
            provider: "Demo Listing",
            category: "Academic",
            amount: 20000,
            deadline: "2026-10-12",
            description:
                "Sample expired deadline used to demonstrate the expired filter."
        },
        {
            id: "SB-DL-DEMO-006",
            name: "Student Opportunity Scholarship",
            provider: "Demo Listing",
            category: "Education",
            amount: 18000,
            deadline: "2027-01-15",
            description:
                "Sample future deadline for testing the deadline list."
        }
    ];

    let deadlines = [...demoDeadlines];

    // =====================================================
    // 4. HELPER FUNCTIONS
    // =====================================================

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => {
            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[character];
        });
    }

    function formatCurrency(amount) {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0
        }).format(Number(amount) || 0);
    }

    function parseDate(dateString) {
        if (!dateString) {
            return null;
        }

        const date = new Date(`${dateString}T00:00:00`);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return date;
    }

    function getToday() {
        const now = new Date();

        return new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
    }

    function getDaysRemaining(deadlineString) {
        const deadlineDate = parseDate(deadlineString);

        if (!deadlineDate) {
            return null;
        }

        const difference = deadlineDate.getTime() - getToday().getTime();

        return Math.round(difference / (1000 * 60 * 60 * 24));
    }

    function formatDate(dateString) {
        const date = parseDate(dateString);

        if (!date) {
            return "Date unavailable";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }

    // =====================================================
    // 5. DETERMINE DEADLINE STATUS
    // =====================================================

    function getDeadlineStatus(deadlineString) {
        const daysRemaining = getDaysRemaining(deadlineString);

        if (daysRemaining === null) {
            return "unknown";
        }

        if (daysRemaining < 0) {
            return "expired";
        }

        if (daysRemaining <= 7) {
            return "urgent";
        }

        return "upcoming";
    }

    function getDeadlineStatusLabel(status) {
        const labels = {
            upcoming: "Upcoming",
            urgent: "Closing Soon",
            expired: "Expired",
            unknown: "Date Unavailable"
        };

        return labels[status] || "Unknown";
    }

    function getDeadlineIcon(status) {
        const icons = {
            upcoming: "fa-calendar-check",
            urgent: "fa-hourglass-half",
            expired: "fa-calendar-xmark",
            unknown: "fa-calendar"
        };

        return icons[status] || "fa-calendar";
    }

    function getRemainingText(deadlineString) {
        const daysRemaining = getDaysRemaining(deadlineString);

        if (daysRemaining === null) {
            return "Deadline unavailable";
        }

        if (daysRemaining < 0) {
            const daysPassed = Math.abs(daysRemaining);

            return `Closed ${daysPassed} ${
                daysPassed === 1 ? "day" : "days"
            } ago`;
        }

        if (daysRemaining === 0) {
            return "Deadline is today";
        }

        if (daysRemaining === 1) {
            return "1 day remaining";
        }

        return `${daysRemaining} days remaining`;
    }

    // =====================================================
    // 6. UPDATE STATISTICS
    // =====================================================

    function updateStatistics() {
        const total = deadlines.length;

        const upcoming = deadlines.filter(
            item => getDeadlineStatus(item.deadline) === "upcoming"
        ).length;

        const urgent = deadlines.filter(
            item => getDeadlineStatus(item.deadline) === "urgent"
        ).length;

        const expired = deadlines.filter(
            item => getDeadlineStatus(item.deadline) === "expired"
        ).length;

        if (totalDeadlinesElement) {
            totalDeadlinesElement.textContent = total;
        }

        if (upcomingDeadlinesElement) {
            upcomingDeadlinesElement.textContent = upcoming;
        }

        if (urgentDeadlinesElement) {
            urgentDeadlinesElement.textContent = urgent;
        }

        if (expiredDeadlinesElement) {
            expiredDeadlinesElement.textContent = expired;
        }
    }

    // =====================================================
    // 7. CREATE DEADLINE CARD
    // =====================================================

    function createDeadlineCard(item) {
        const status = getDeadlineStatus(item.deadline);
        const statusLabel = getDeadlineStatusLabel(status);
        const statusIcon = getDeadlineIcon(status);
        const remainingText = getRemainingText(item.deadline);

        return `
            <article class="deadline-card deadline-${escapeHTML(status)}">

                <div class="deadline-card-main">

                    <div class="deadline-card-icon">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>

                    <div class="deadline-card-info">

                        <div class="deadline-card-heading">

                            <h3>
                                ${escapeHTML(item.name)}
                            </h3>

                            <span class="deadline-status status-${escapeHTML(status)}">
                                <i class="fa-solid ${statusIcon}"></i>
                                ${escapeHTML(statusLabel)}
                            </span>

                        </div>

                        <p class="deadline-provider">
                            <i class="fa-solid fa-building-columns"></i>
                            ${escapeHTML(item.provider)}
                        </p>

                        <p class="deadline-description">
                            ${escapeHTML(item.description)}
                        </p>

                    </div>

                </div>


                <div class="deadline-card-details">

                    <div class="deadline-detail-item">

                        <span>Scholarship Amount</span>

                        <strong>
                            ${formatCurrency(item.amount)}
                        </strong>

                    </div>


                    <div class="deadline-detail-item">

                        <span>Application Deadline</span>

                        <strong>
                            ${formatDate(item.deadline)}
                        </strong>

                    </div>


                    <div class="deadline-detail-item deadline-countdown">

                        <span>Time Remaining</span>

                        <strong>
                            ${escapeHTML(remainingText)}
                        </strong>

                    </div>

                </div>


                <div class="deadline-card-footer">

                    <span class="deadline-category">
                        ${escapeHTML(item.category)}
                    </span>

                    ${
                        status === "expired"
                            ? `
                                <span class="deadline-closed-label">
                                    <i class="fa-solid fa-lock"></i>
                                    Deadline passed
                                </span>
                            `
                            : `
                                <a
                                    href="scholarships.html"
                                    class="deadline-action-button"
                                    aria-label="Browse scholarships"
                                >
                                    View Scholarships
                                    <i class="fa-solid fa-arrow-right"></i>
                                </a>
                            `
                    }

                </div>

            </article>
        `;
    }

    // =====================================================
    // 8. FILTER DEADLINES
    // =====================================================

    function getFilteredDeadlines() {
        const searchTerm = deadlineSearch
            ? deadlineSearch.value.trim().toLowerCase()
            : "";

        const selectedView = deadlineView
            ? deadlineView.value
            : "all";

        const filtered = deadlines.filter(item => {
            const searchableText = [
                item.name,
                item.provider,
                item.category,
                item.description
            ]
                .join(" ")
                .toLowerCase();

            const matchesSearch = searchableText.includes(searchTerm);

            const status = getDeadlineStatus(item.deadline);

            let matchesView = true;

            if (selectedView === "upcoming") {
                matchesView = status === "upcoming";
            } else if (selectedView === "urgent") {
                matchesView = status === "urgent";
            } else if (selectedView === "expired") {
                matchesView = status === "expired";
            }

            return matchesSearch && matchesView;
        });

        return sortDeadlines(filtered);
    }

    // =====================================================
    // 9. SORT DEADLINES
    // =====================================================

    function sortDeadlines(items) {
        const sortBy = deadlineSort
            ? deadlineSort.value
            : "nearest";

        return [...items].sort((a, b) => {
            if (sortBy === "name") {
                return a.name.localeCompare(b.name);
            }

            const dateA = parseDate(a.deadline);
            const dateB = parseDate(b.deadline);

            if (!dateA && !dateB) {
                return 0;
            }

            if (!dateA) {
                return 1;
            }

            if (!dateB) {
                return -1;
            }

            if (sortBy === "latest") {
                return dateB.getTime() - dateA.getTime();
            }

            return dateA.getTime() - dateB.getTime();
        });
    }

    // =====================================================
    // 10. EMPTY STATE
    // =====================================================

    function showEmptyState() {
        if (deadlinesList) {
            deadlinesList.innerHTML = "";
        }

        if (deadlineCount) {
            deadlineCount.textContent = "0 deadlines";
        }

        if (deadlinesEmptyState) {
            deadlinesEmptyState.hidden = false;
        }
    }

    function hideEmptyState() {
        if (deadlinesEmptyState) {
            deadlinesEmptyState.hidden = true;
        }
    }

    // =====================================================
    // 11. RENDER DEADLINES
    // =====================================================

    function renderDeadlines() {
        updateStatistics();

        if (!deadlinesList) {
            console.error(
                "ScholarBridge: deadlinesList element was not found."
            );

            return;
        }

        const filteredDeadlines = getFilteredDeadlines();

        if (filteredDeadlines.length === 0) {
            showEmptyState();

            if (deadlinesEmptyState) {
                const heading = deadlinesEmptyState.querySelector("h3");
                const message = deadlinesEmptyState.querySelector("p");

                if (heading) {
                    heading.textContent = deadlines.length === 0
                        ? "No deadlines available"
                        : "No deadlines found";
                }

                if (message) {
                    message.textContent = deadlines.length === 0
                        ? "Scholarship deadlines will appear here when available."
                        : "Try changing your search or deadline filter.";
                }
            }

            return;
        }

        hideEmptyState();

        deadlinesList.innerHTML = filteredDeadlines
            .map(createDeadlineCard)
            .join("");

        if (deadlineCount) {
            const count = filteredDeadlines.length;

            deadlineCount.textContent =
                `${count} ${count === 1 ? "deadline" : "deadlines"}`;
        }
    }

    // =====================================================
    // 12. SEARCH EVENT
    // =====================================================

    if (deadlineSearch) {
        deadlineSearch.addEventListener("input", renderDeadlines);
    }

    // =====================================================
    // 13. VIEW FILTER EVENT
    // =====================================================

    if (deadlineView) {
        deadlineView.addEventListener("change", renderDeadlines);
    }

    // =====================================================
    // 14. SORT EVENT
    // =====================================================

    if (deadlineSort) {
        deadlineSort.addEventListener("change", renderDeadlines);
    }

    // =====================================================
    // 15. RESET FILTERS
    // =====================================================

    function resetFilters() {
        if (deadlineSearch) {
            deadlineSearch.value = "";
        }

        if (deadlineView) {
            deadlineView.value = "all";
        }

        if (deadlineSort) {
            deadlineSort.value = "nearest";
        }

        renderDeadlines();
    }

    if (resetDeadlineFilters) {
        resetDeadlineFilters.addEventListener("click", resetFilters);
    }

    if (emptyStateReset) {
        emptyStateReset.addEventListener("click", resetFilters);
    }

    // =====================================================
    // 16. INITIALIZE PAGE
    // =====================================================

    renderDeadlines();

    console.log("ScholarBridge Deadlines page initialized.");
});