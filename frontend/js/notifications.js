/* =========================================================
   SCHOLARBRIDGE - NOTIFICATIONS
   File: notifications.js

   Features:
   1. Sample notifications
   2. Search notifications
   3. Filter by category and status
   4. Mark notification as read
   5. Mark all notifications as read
   6. Delete notification
   7. Notification statistics
   8. Save demo notification state in localStorage

   IMPORTANT:
   This is frontend demo functionality.
   Real-time notifications require backend integration.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // =====================================================
    // 1. DOM ELEMENTS
    // =====================================================

    const notificationsList = document.getElementById("notificationsList");

    const totalNotificationsElement =
        document.getElementById("totalNotifications");

    const unreadNotificationsElement =
        document.getElementById("unreadNotifications");

    const importantNotificationsElement =
        document.getElementById("importantNotifications");

    const notificationSearch =
        document.getElementById("notificationSearch");

    const notificationFilter =
        document.getElementById("notificationFilter");

    const clearFiltersButton =
        document.getElementById("clearNotificationFilters");

    const markAllReadButton =
        document.getElementById("markAllReadButton");

    const resultsCount =
        document.getElementById("notificationResultsCount");

    const emptyState =
        document.getElementById("notificationEmptyState");

    const emptyTitle =
        document.getElementById("notificationEmptyTitle");

    const emptyDescription =
        document.getElementById("notificationEmptyDescription");

    const resetEmptyFiltersButton =
        document.getElementById("resetEmptyNotificationFilters");

    const allTabCount =
        document.getElementById("allTabCount");

    const categoryTabs = document.querySelectorAll(
        ".notification-tab[data-category]"
    );

    const currentYearElement =
        document.getElementById("currentYear");


    // =====================================================
    // 2. CONFIGURATION
    // =====================================================

    const STORAGE_KEY = "scholarBridgeNotificationsDemo";

    const CATEGORY_INFO = {
        application: {
            label: "Application",
            icon: "fa-file-lines"
        },

        deadline: {
            label: "Deadline",
            icon: "fa-calendar-days"
        },

        scholarship: {
            label: "Scholarship",
            icon: "fa-graduation-cap"
        },

        system: {
            label: "Announcement",
            icon: "fa-bullhorn"
        }
    };

    const VALID_CATEGORIES = Object.keys(CATEGORY_INFO);

    let activeCategory = "all";

    let notifications = [];

    let storageAvailable = true;


    // =====================================================
    // 3. HELPER FUNCTIONS
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


    function createId() {
        if (
            window.crypto &&
            typeof window.crypto.randomUUID === "function"
        ) {
            return window.crypto.randomUUID();
        }

        return `notification-${Date.now()}-${Math.random()
            .toString(16)
            .slice(2)}`;
    }


    function formatDate(dateString) {
        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    function formatRelativeTime(dateString) {
        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        const difference = Date.now() - date.getTime();

        if (difference < 0) {
            return formatDate(dateString);
        }

        const minutes = Math.floor(difference / 60000);
        const hours = Math.floor(difference / 3600000);
        const days = Math.floor(difference / 86400000);

        if (minutes < 1) {
            return "Just now";
        }

        if (minutes < 60) {
            return `${minutes} min ago`;
        }

        if (hours < 24) {
            return `${hours} hr ago`;
        }

        if (days === 1) {
            return "Yesterday";
        }

        if (days < 7) {
            return `${days} days ago`;
        }

        return formatDate(dateString);
    }


    function getCategoryInfo(category) {
        return CATEGORY_INFO[category] || CATEGORY_INFO.system;
    }


    function showMessage(message) {
        // Keep the demo accessible without adding another alert library.
        window.alert(message);
    }


    // =====================================================
    // 4. SAMPLE NOTIFICATIONS
    // =====================================================

    function createSampleNotifications() {
        const now = Date.now();

        const hoursAgo = hours => {
            return new Date(now - hours * 60 * 60 * 1000).toISOString();
        };

        const daysAgo = days => {
            return new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
        };

        return [
            {
                id: createId(),
                title: "Welcome to ScholarBridge",
                message:
                    "Explore scholarship opportunities and keep track of your applications from your dashboard.",
                category: "system",
                important: true,
                read: false,
                createdAt: hoursAgo(1),
                link: "dashboard.html"
            },

            {
                id: createId(),
                title: "Review your application status",
                message:
                    "Visit the Applications page to review the current status of your scholarship application records.",
                category: "application",
                important: true,
                read: false,
                createdAt: hoursAgo(4),
                link: "applications.html"
            },

            {
                id: createId(),
                title: "Check upcoming deadlines",
                message:
                    "Keep your scholarship deadlines organized. Visit the Deadlines page to review and manage your reminders.",
                category: "deadline",
                important: true,
                read: false,
                createdAt: hoursAgo(9),
                link: "deadlines.html"
            },

            {
                id: createId(),
                title: "Explore scholarship opportunities",
                message:
                    "Browse the Scholarships page to discover available opportunities that may match your education profile.",
                category: "scholarship",
                important: false,
                read: false,
                createdAt: daysAgo(1),
                link: "scholarships.html"
            },

            {
                id: createId(),
                title: "Keep your profile updated",
                message:
                    "Review your profile details so your scholarship information stays organized and up to date.",
                category: "system",
                important: false,
                read: true,
                createdAt: daysAgo(2),
                link: "profile.html"
            },

            {
                id: createId(),
                title: "Review your saved applications",
                message:
                    "Check your application records and update any information that needs attention.",
                category: "application",
                important: false,
                read: true,
                createdAt: daysAgo(3),
                link: "applications.html"
            }
        ];
    }


    // =====================================================
    // 5. NORMALIZE NOTIFICATION DATA
    // =====================================================

    function normalizeNotification(item) {
        if (!item || typeof item !== "object") {
            return null;
        }

        const category = VALID_CATEGORIES.includes(item.category)
            ? item.category
            : "system";

        const createdAt = item.createdAt &&
            !Number.isNaN(new Date(item.createdAt).getTime())
                ? new Date(item.createdAt).toISOString()
                : new Date().toISOString();

        return {
            id: String(item.id || createId()),
            title: String(item.title || "Notification").slice(0, 200),
            message: String(item.message || "").slice(0, 2000),
            category,
            important: item.important === true,
            read: item.read === true,
            createdAt,
            link: typeof item.link === "string" ? item.link : ""
        };
    }


    // =====================================================
    // 6. LOAD NOTIFICATIONS
    // =====================================================

    function loadNotifications() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);

            if (savedData === null) {
                notifications = createSampleNotifications();

                saveNotifications();

                return;
            }

            const parsedData = JSON.parse(savedData);

            if (!Array.isArray(parsedData)) {
                notifications = createSampleNotifications();

                saveNotifications();

                return;
            }

            notifications = parsedData
                .map(normalizeNotification)
                .filter(Boolean);

        } catch (error) {
            storageAvailable = false;

            console.error(
                "ScholarBridge: Unable to load notifications.",
                error
            );

            notifications = createSampleNotifications();
        }
    }


    // =====================================================
    // 7. SAVE NOTIFICATIONS
    // =====================================================

    function saveNotifications() {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(notifications)
            );

            storageAvailable = true;

            return true;

        } catch (error) {
            storageAvailable = false;

            console.error(
                "ScholarBridge: Unable to save notifications.",
                error
            );

            return false;
        }
    }


    // =====================================================
    // 8. UPDATE STATISTICS
    // =====================================================

    function updateStatistics() {
        const total = notifications.length;

        const unread = notifications.filter(
            notification => !notification.read
        ).length;

        const important = notifications.filter(
            notification => notification.important
        ).length;

        if (totalNotificationsElement) {
            totalNotificationsElement.textContent = total;
        }

        if (unreadNotificationsElement) {
            unreadNotificationsElement.textContent = unread;
        }

        if (importantNotificationsElement) {
            importantNotificationsElement.textContent = important;
        }

        if (allTabCount) {
            allTabCount.textContent = total;
        }

        if (markAllReadButton) {
            markAllReadButton.disabled = unread === 0;

            markAllReadButton.setAttribute(
                "aria-label",
                unread === 0
                    ? "All notifications are already read"
                    : `Mark ${unread} notifications as read`
            );
        }

        categoryTabs.forEach(tab => {
            const category = tab.dataset.category;

            const count = category === "all"
                ? total
                : notifications.filter(
                    notification => notification.category === category
                ).length;

            const existingCount = tab.querySelector(
                ".notification-tab-count"
            );

            if (existingCount) {
                existingCount.textContent = count;
            }
        });
    }


    // =====================================================
    // 9. FILTER NOTIFICATIONS
    // =====================================================

    function getFilteredNotifications() {
        const searchTerm = notificationSearch
            ? notificationSearch.value.trim().toLowerCase()
            : "";

        const selectedFilter = notificationFilter
            ? notificationFilter.value
            : "all";

        return notifications
            .filter(notification => {
                const matchesCategory =
                    activeCategory === "all" ||
                    notification.category === activeCategory;

                if (!matchesCategory) {
                    return false;
                }

                const searchableText = [
                    notification.title,
                    notification.message,
                    notification.category,
                    getCategoryInfo(notification.category).label
                ]
                    .join(" ")
                    .toLowerCase();

                const matchesSearch =
                    searchableText.includes(searchTerm);

                if (!matchesSearch) {
                    return false;
                }

                switch (selectedFilter) {
                    case "unread":
                        return !notification.read;

                    case "read":
                        return notification.read;

                    case "important":
                        return notification.important;

                    case "application":
                    case "deadline":
                    case "scholarship":
                    case "system":
                        return notification.category === selectedFilter;

                    case "all":
                    default:
                        return true;
                }
            })
            .sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
    }


    // =====================================================
    // 10. CREATE NOTIFICATION CARD
    // =====================================================

    function createNotificationCard(notification) {
        const categoryInfo = getCategoryInfo(notification.category);

        const unreadClass = notification.read ? "" : "unread";

        const readButton = notification.read
            ? `
                <button
                    type="button"
                    data-action="mark-unread"
                    data-id="${escapeHTML(notification.id)}"
                    aria-label="Mark ${escapeHTML(notification.title)} as unread"
                >
                    <i class="fa-regular fa-envelope"></i>
                    Mark unread
                </button>
            `
            : `
                <button
                    type="button"
                    data-action="mark-read"
                    data-id="${escapeHTML(notification.id)}"
                    aria-label="Mark ${escapeHTML(notification.title)} as read"
                >
                    <i class="fa-solid fa-check"></i>
                    Mark as read
                </button>
            `;

        const importantBadge = notification.important
            ? `
                <span class="notification-important-badge">
                    <i class="fa-solid fa-star"></i>
                    Important
                </span>
            `
            : "";

        const unreadDot = notification.read
            ? ""
            : `
                <span
                    class="notification-unread-dot"
                    aria-label="Unread"
                    title="Unread notification"
                ></span>
            `;

        const linkHTML = isSafeInternalPage(notification.link)
            ? `
                <a
                    class="notification-open-link"
                    href="${escapeHTML(notification.link)}"
                    data-action="open-link"
                    data-id="${escapeHTML(notification.id)}"
                >
                    View details
                    <i class="fa-solid fa-arrow-right"></i>
                </a>
            `
            : "";

        return `
            <article
                class="notification-item ${unreadClass}"
                data-notification-id="${escapeHTML(notification.id)}"
            >

                <div class="notification-icon ${escapeHTML(notification.category)}">
                    <i class="fa-solid ${categoryInfo.icon}"></i>
                </div>

                <div class="notification-content">

                    <div class="notification-card-topline">

                        <span class="notification-category">
                            ${escapeHTML(categoryInfo.label)}
                        </span>

                        ${importantBadge}

                        ${unreadDot}

                    </div>

                    <h3>${escapeHTML(notification.title)}</h3>

                    <p>${escapeHTML(notification.message)}</p>

                    <div class="notification-meta">

                        <span>
                            <i class="fa-regular fa-clock"></i>
                            ${escapeHTML(formatRelativeTime(notification.createdAt))}
                        </span>

                        <span>
                            <i class="fa-regular fa-calendar"></i>
                            ${escapeHTML(formatDate(notification.createdAt))}
                        </span>

                        <span>
                            <i class="fa-regular fa-envelope"></i>
                            ${notification.read ? "Read" : "Unread"}
                        </span>

                    </div>

                    <div class="notification-actions">

                        ${linkHTML}

                        ${readButton}

                        <button
                            type="button"
                            class="notification-delete-button"
                            data-action="delete"
                            data-id="${escapeHTML(notification.id)}"
                            aria-label="Delete ${escapeHTML(notification.title)}"
                        >
                            <i class="fa-solid fa-trash"></i>
                            Delete
                        </button>

                    </div>

                </div>

            </article>
        `;
    }


    // =====================================================
    // 11. SAFE INTERNAL PAGE LINKS
    // =====================================================

    function isSafeInternalPage(link) {
        const allowedPages = [
            "dashboard.html",
            "scholarships.html",
            "applications.html",
            "deadlines.html",
            "profile.html",
            "notifications.html"
        ];

        if (!link || typeof link !== "string") {
            return false;
        }

        // Only permit known local HTML pages.
        return allowedPages.includes(link);
    }


    // =====================================================
    // 12. EMPTY STATE
    // =====================================================

    function showEmptyState() {
        if (notificationsList) {
            notificationsList.innerHTML = "";
            notificationsList.hidden = true;
        }

        if (emptyState) {
            emptyState.hidden = false;
        }

        if (emptyTitle) {
            emptyTitle.textContent = notifications.length === 0
                ? "You're all caught up!"
                : "No matching notifications";
        }

        if (emptyDescription) {
            emptyDescription.textContent = notifications.length === 0
                ? "There are no notifications to show right now."
                : "Try another search term or change your notification filters.";
        }
    }


    function hideEmptyState() {
        if (emptyState) {
            emptyState.hidden = true;
        }

        if (notificationsList) {
            notificationsList.hidden = false;
        }
    }


    // =====================================================
    // 13. RENDER NOTIFICATIONS
    // =====================================================

    function renderNotifications() {
        updateStatistics();

        if (!notificationsList) {
            console.error(
                "ScholarBridge: notificationsList element was not found."
            );

            return;
        }

        const filteredNotifications = getFilteredNotifications();

        if (resultsCount) {
            const count = filteredNotifications.length;

            resultsCount.textContent =
                `${count} ${count === 1 ? "notification" : "notifications"}`;
        }

        if (filteredNotifications.length === 0) {
            showEmptyState();
            return;
        }

        hideEmptyState();

        notificationsList.innerHTML = filteredNotifications
            .map(createNotificationCard)
            .join("");
    }


    // =====================================================
    // 14. MARK ONE NOTIFICATION AS READ / UNREAD
    // =====================================================

    function updateReadStatus(id, readStatus) {
        const notification = notifications.find(
            item => item.id === id
        );

        if (!notification) {
            return;
        }

        const previousStatus = notification.read;

        notification.read = readStatus;

        if (!saveNotifications()) {
            notification.read = previousStatus;

            showMessage(
                "Unable to save the notification status in browser storage."
            );

            return;
        }

        renderNotifications();
    }


    // =====================================================
    // 15. DELETE NOTIFICATION
    // =====================================================

    function deleteNotification(id) {
        const notification = notifications.find(
            item => item.id === id
        );

        if (!notification) {
            return;
        }

        const confirmed = window.confirm(
            `Delete the notification "${notification.title}"?`
        );

        if (!confirmed) {
            return;
        }

        const previousNotifications = [...notifications];

        notifications = notifications.filter(
            item => item.id !== id
        );

        if (!saveNotifications()) {
            notifications = previousNotifications;

            showMessage(
                "Unable to delete the notification. Browser storage may be unavailable."
            );

            return;
        }

        renderNotifications();
    }


    // =====================================================
    // 16. NOTIFICATION LIST ACTIONS
    // =====================================================

    if (notificationsList) {
        notificationsList.addEventListener("click", event => {
            const button = event.target.closest(
                "button[data-action]"
            );

            const link = event.target.closest(
                'a[data-action="open-link"]'
            );

            if (link) {
                const id = link.dataset.id;

                const notification = notifications.find(
                    item => item.id === id
                );

                if (notification && !notification.read) {
                    notification.read = true;

                    saveNotifications();
                }

                return;
            }

            if (!button) {
                return;
            }

            const id = button.dataset.id;
            const action = button.dataset.action;

            switch (action) {
                case "mark-read":
                    updateReadStatus(id, true);
                    break;

                case "mark-unread":
                    updateReadStatus(id, false);
                    break;

                case "delete":
                    deleteNotification(id);
                    break;

                default:
                    break;
            }
        });
    }


    // =====================================================
    // 17. MARK ALL AS READ
    // =====================================================

    if (markAllReadButton) {
        markAllReadButton.addEventListener("click", () => {
            const previousNotifications = notifications.map(
                item => ({ ...item })
            );

            notifications.forEach(notification => {
                notification.read = true;
            });

            if (!saveNotifications()) {
                notifications = previousNotifications;

                showMessage(
                    "Unable to update notifications. Please check browser storage."
                );

                return;
            }

            renderNotifications();
        });
    }


    // =====================================================
    // 18. SEARCH
    // =====================================================

    if (notificationSearch) {
        notificationSearch.addEventListener(
            "input",
            renderNotifications
        );
    }


    // =====================================================
    // 19. FILTER DROPDOWN
    // =====================================================

    if (notificationFilter) {
        notificationFilter.addEventListener(
            "change",
            renderNotifications
        );
    }


    // =====================================================
    // 20. CATEGORY TABS
    // =====================================================

    categoryTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const category = tab.dataset.category;

            if (
                category !== "all" &&
                !VALID_CATEGORIES.includes(category)
            ) {
                return;
            }

            activeCategory = category;

            categoryTabs.forEach(otherTab => {
                const isActive = otherTab === tab;

                otherTab.classList.toggle("active", isActive);

                otherTab.setAttribute(
                    "aria-pressed",
                    String(isActive)
                );
            });

            // Keep the dropdown consistent with the selected category.
            if (notificationFilter) {
                const matchingOption = Array.from(
                    notificationFilter.options
                ).find(option => option.value === category);

                if (matchingOption) {
                    notificationFilter.value = category;
                } else {
                    notificationFilter.value = "all";
                }
            }

            renderNotifications();
        });
    });


    // =====================================================
    // 21. RESET FILTERS
    // =====================================================

    function resetFilters() {
        activeCategory = "all";

        if (notificationSearch) {
            notificationSearch.value = "";
        }

        if (notificationFilter) {
            notificationFilter.value = "all";
        }

        categoryTabs.forEach(tab => {
            const isActive = tab.dataset.category === "all";

            tab.classList.toggle("active", isActive);

            tab.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });

        renderNotifications();
    }


    if (clearFiltersButton) {
        clearFiltersButton.addEventListener("click", resetFilters);
    }


    if (resetEmptyFiltersButton) {
        resetEmptyFiltersButton.addEventListener(
            "click",
            resetFilters
        );
    }


    // =====================================================
    // 22. OPTIONAL TAB COUNTS
    // =====================================================

    categoryTabs.forEach(tab => {
        const category = tab.dataset.category;

        if (category === "all") {
            return;
        }

        if (!tab.querySelector(".notification-tab-count")) {
            const countElement = document.createElement("span");

            countElement.className = "notification-tab-count";

            tab.appendChild(countElement);
        }
    });


    // =====================================================
    // 23. FOOTER YEAR
    // =====================================================

    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }


    // =====================================================
    // 24. INITIALIZE PAGE
    // =====================================================

    loadNotifications();

    renderNotifications();

    if (!storageAvailable) {
        console.warn(
            "ScholarBridge is running with temporary notification data. Changes may not persist."
        );
    }

    console.log(
        "ScholarBridge Notifications initialized:",
        notifications.length,
        "demo notifications"
    );

});