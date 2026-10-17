"use strict";

/* =====================================================
   SCHOLARBRIDGE - STUDENT DASHBOARD
   Frontend: HTML, CSS, JavaScript
   Backend: Node.js + Express + MongoDB
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       1. CONFIGURATION
    ===================================================== */

    const API_BASE_URL = "http://localhost:5000/api";

    const token = localStorage.getItem("token");

    const $ = function (id) {
        return document.getElementById(id);
    };

    let currentStudent = null;
    let scholarshipData = [];
    let toastTimer = null;

    /* =====================================================
       2. AUTHENTICATION
    ===================================================== */

    if (!token) {
        window.location.replace("login.html");
        return;
    }

    /* =====================================================
       3. CURRENT YEAR
    ===================================================== */

    const currentYear = new Date().getFullYear();

    if ($("currentYear")) {
        $("currentYear").textContent = currentYear;
    }

    if ($("footerYear")) {
        $("footerYear").textContent = currentYear;
    }

    /* =====================================================
       4. TOAST MESSAGE
    ===================================================== */

    function showToast(message) {

        const toast = $("toast");

        if (!toast) {
            console.log(message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(function () {
            toast.classList.remove("show");
        }, 3200);
    }

    /* =====================================================
       5. SAFE HTML TEXT
    ===================================================== */

    function escapeHTML(value) {

        return String(value ?? "").replace(/[&<>"']/g, function (char) {

            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[char];
        });
    }

    /* =====================================================
       6. API REQUEST
    ===================================================== */

    async function apiRequest(endpoint, options = {}) {

        let response;

        try {

            response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,

                headers: {
                    Accept: "application/json",
                    ...(options.headers || {})
                }
            });

        } catch (error) {

            throw new Error(
                "Unable to connect to the server. Please check your connection."
            );
        }

        let data;

        try {

            data = await response.json();

        } catch (error) {

            throw new Error("The server returned an invalid response.");
        }

        if (!response.ok || data.success === false) {

            const apiError = new Error(
                data.message || "Unable to complete the request."
            );

            apiError.status = response.status;

            throw apiError;
        }

        return data;
    }

    /* =====================================================
       7. LOAD STUDENT PROFILE
    ===================================================== */

    async function loadStudentProfile() {

        try {

            const data = await apiRequest("/auth/profile", {
                method: "GET",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!data.user) {
                throw new Error("Student profile was not returned.");
            }

            currentStudent = data.user;

            renderStudentProfile(currentStudent);

            return true;

        } catch (error) {

            console.error("Profile loading error:", error);

            if (error.status === 401 || error.status === 403) {

                clearAuthentication();

                window.location.replace("login.html");

                return false;
            }

            showToast(
                "Unable to load your profile. Please check the backend connection."
            );

            return false;
        }
    }

    /* =====================================================
       8. RENDER STUDENT PROFILE
    ===================================================== */

    function renderStudentProfile(student) {

        const fullName = student.fullName || "Student";
        const firstName = fullName.trim().split(/\s+/)[0];
        const initial = fullName.trim().charAt(0).toUpperCase() || "S";

        const category = student.category || "Not specified";
        const email = student.email || "Not provided";
        const mobile = student.mobile || "Not provided";
        const role = student.role || "student";

        const profileFields = {
            welcomeName: firstName,
            topStudentName: fullName,
            topStudentCategory: `${category} Student`,
            topAvatar: initial,
            profileAvatar: initial,
            profileName: fullName,
            profileEmail: email,
            profileBadge: `${category} Student`,
            detailName: fullName,
            detailEmail: email,
            detailMobile: mobile,
            detailCategory: category,
            detailRole: role
        };

        Object.entries(profileFields).forEach(function ([id, value]) {

            const element = $(id);

            if (element) {
                element.textContent = value;
            }
        });

        if ($("detailCreated")) {

            if (student.createdAt) {

                const date = new Date(student.createdAt);

                $("detailCreated").textContent =
                    Number.isNaN(date.getTime())
                        ? "Not available"
                        : date.toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                        });

            } else {

                $("detailCreated").textContent = "Not available";
            }
        }

        updateProfileProgress(student);
    }

    /* =====================================================
       9. PROFILE COMPLETION
    ===================================================== */

    function updateProfileProgress(student) {

        const fields = [
            student.fullName,
            student.email,
            student.mobile,
            student.category
        ];

        const completed = fields.filter(function (value) {
            return Boolean(value && String(value).trim());
        }).length;

        const percentage = Math.round(
            (completed / fields.length) * 100
        );

        if ($("profileProgress")) {
            $("profileProgress").textContent = `${percentage}%`;
        }

        if ($("progressCircle")) {

            $("progressCircle").style.background =
                `conic-gradient(
                    #21864b ${percentage * 3.6}deg,
                    #e2f2e6 ${percentage * 3.6}deg
                )`;
        }
    }

    /* =====================================================
       10. SCHOLARSHIP DATA
       
       Do not invent scholarship amounts or deadlines.
       Display only data supplied by a verified source.
    ===================================================== */

    function renderScholarships() {

        const grid = $("scholarshipGrid");

        if (!grid) {
            return;
        }

        const searchValue = $("scholarshipSearch")
            ? $("scholarshipSearch").value.trim().toLowerCase()
            : "";

        const categoryValue = $("scholarshipCategory")
            ? $("scholarshipCategory").value
            : "all";

        const filtered = scholarshipData.filter(function (item) {

            const searchableText = [
                item.title,
                item.provider,
                item.description
            ].join(" ").toLowerCase();

            const matchesSearch = searchableText.includes(searchValue);

            const categories = Array.isArray(item.categories)
                ? item.categories
                : [];

            const matchesCategory =
                categoryValue === "all" ||
                categories.includes(categoryValue);

            return matchesSearch && matchesCategory;
        });

        if ($("availableCount")) {
            $("availableCount").textContent = scholarshipData.length;
        }

        if ($("matchedCount")) {

            const category = currentStudent
                ? currentStudent.category
                : "";

            const matched = scholarshipData.filter(function (item) {

                return Array.isArray(item.categories) &&
                    item.categories.includes(category);
            });

            $("matchedCount").textContent = matched.length;
        }

        if (filtered.length === 0) {

            grid.innerHTML = `
                <div class="loading-state">
                    <i class="fa-solid fa-graduation-cap"></i>

                    <p>
                        No verified scholarships are available yet.
                        Scholarship information will appear here when
                        verified data is connected.
                    </p>
                </div>
            `;

            return;
        }

        grid.innerHTML = filtered.map(function (item) {

            const title = escapeHTML(item.title || "Scholarship");

            const provider = escapeHTML(
                item.provider || "Provider not specified"
            );

            const description = escapeHTML(
                item.description ||
                "Please review the official eligibility criteria."
            );

            const amount = escapeHTML(
                item.amount || "Check official website"
            );

            const deadline = escapeHTML(
                item.deadline || "Verify officially"
            );

            const categories = Array.isArray(item.categories)
                ? item.categories
                : [];

            const categoryLabels = categories.length
                ? categories.map(escapeHTML).join(", ")
                : "All eligible categories";

            const officialURL = getSafeOfficialURL(item.officialUrl);

            const officialButton = officialURL
                ? `
                    <a
                        class="btn btn-outline official-link"
                        href="${escapeHTML(officialURL)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Official Details
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                `
                : `
                    <button
                        class="btn btn-outline official-link"
                        type="button"
                        disabled
                    >
                        Official link unavailable
                    </button>
                `;

            return `
                <article class="scholarship-card">

                    <div class="scholarship-top">

                        <div class="scholarship-logo">
                            <i class="fa-solid fa-graduation-cap"></i>
                        </div>

                        <span class="scholarship-type">
                            ${categoryLabels}
                        </span>

                    </div>

                    <h3>${title}</h3>

                    <p class="scholarship-provider">
                        ${provider}
                    </p>

                    <p class="scholarship-description">
                        ${description}
                    </p>

                    <div class="scholarship-meta">

                        <div class="meta-item">
                            <span>Scholarship amount</span>
                            <strong>${amount}</strong>
                        </div>

                        <div class="meta-item">
                            <span>Application deadline</span>
                            <strong>${deadline}</strong>
                        </div>

                    </div>

                    <div class="scholarship-card-actions">
                        ${officialButton}
                    </div>

                </article>
            `;

        }).join("");
    }

    /* =====================================================
       11. VALIDATE OFFICIAL URL
    ===================================================== */

    function getSafeOfficialURL(value) {

        if (!value) {
            return "";
        }

        try {

            const url = new URL(value);

            if (
                url.protocol !== "https:" &&
                url.protocol !== "http:"
            ) {
                return "";
            }

            return url.href;

        } catch (error) {

            return "";
        }
    }

    /* =====================================================
       12. SEARCH AND FILTER
    ===================================================== */

    if ($("scholarshipSearch")) {

        $("scholarshipSearch").addEventListener(
            "input",
            renderScholarships
        );
    }

    if ($("scholarshipCategory")) {

        $("scholarshipCategory").addEventListener(
            "change",
            renderScholarships
        );
    }

    /* =====================================================
       13. DASHBOARD NAVIGATION
    ===================================================== */

    const sectionTitles = {
        dashboard: "My Dashboard",
        scholarships: "Find Scholarships",
        applications: "My Applications",
        documents: "Document Locker",
        deadlines: "Deadline Alerts",
        profile: "My Student Profile"
    };

    function openSection(sectionName) {

        const dashboardSection = $("dashboardSection");
        const profileSection = $("profileSection");
        const placeholderSection = $("placeholderSection");

        if (
            !dashboardSection ||
            !profileSection ||
            !placeholderSection
        ) {
            console.error("Dashboard section elements are missing.");
            return;
        }

        dashboardSection.hidden = true;
        profileSection.hidden = true;
        placeholderSection.hidden = true;

        if (sectionName === "dashboard") {

            dashboardSection.hidden = false;

        } else if (sectionName === "profile") {

            profileSection.hidden = false;

        } else if (sectionName === "scholarships") {

            dashboardSection.hidden = false;

            setTimeout(function () {

                const scholarshipSection = $("scholarships");

                if (scholarshipSection) {
                    scholarshipSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });
                }

            }, 0);

        } else {

            placeholderSection.hidden = false;

            const sectionNames = {

                applications: {
                    title: "My Applications",
                    description:
                        "Application tracking will be connected in the next development step."
                },

                documents: {
                    title: "Document Locker",
                    description:
                        "Secure document uploads and management will be connected next."
                },

                deadlines: {
                    title: "Deadline Alerts",
                    description:
                        "Verified deadline tracking and notifications will be connected next."
                }
            };

            const info = sectionNames[sectionName] || {
                title: "Coming Soon",
                description:
                    "This module will be available in a future update."
            };

            if ($("placeholderTitle")) {
                $("placeholderTitle").textContent = info.title;
            }

            if ($("placeholderDescription")) {
                $("placeholderDescription").textContent =
                    info.description;
            }
        }

        if ($("pageTitle")) {
            $("pageTitle").textContent =
                sectionTitles[sectionName] || "My Dashboard";
        }

        document.querySelectorAll(".nav-link").forEach(function (link) {

            link.classList.toggle(
                "active",
                link.dataset.section === sectionName
            );
        });

        closeMobileSidebar();

        if (sectionName !== "scholarships") {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        }
    }

    document.querySelectorAll("[data-section]").forEach(function (link) {

        link.addEventListener("click", function (event) {

            event.preventDefault();

            openSection(link.dataset.section);
        });
    });

    document.querySelectorAll("[data-open]").forEach(function (button) {

        button.addEventListener("click", function () {

            openSection(button.dataset.open);
        });
    });

    if ($("viewAllScholarships")) {

        $("viewAllScholarships").addEventListener("click", function () {

            openSection("scholarships");
        });
    }

    if ($("profileShortcut")) {

        $("profileShortcut").addEventListener("click", function () {

            openSection("profile");
        });
    }

    if ($("backToDashboard")) {

        $("backToDashboard").addEventListener("click", function () {

            openSection("dashboard");
        });
    }

    /* =====================================================
       14. MOBILE SIDEBAR
    ===================================================== */

    function closeMobileSidebar() {

        if ($("sidebar")) {
            $("sidebar").classList.remove("open");
        }

        if ($("sidebarOverlay")) {
            $("sidebarOverlay").classList.remove("show");
        }

        if ($("menuToggle")) {
            $("menuToggle").setAttribute("aria-expanded", "false");
        }
    }

    if ($("menuToggle")) {

        $("menuToggle").addEventListener("click", function () {

            const sidebar = $("sidebar");
            const overlay = $("sidebarOverlay");

            if (!sidebar) {
                return;
            }

            const isOpen = sidebar.classList.toggle("open");

            if (overlay) {
                overlay.classList.toggle("show", isOpen);
            }

            $("menuToggle").setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });
    }

    if ($("sidebarOverlay")) {

        $("sidebarOverlay").addEventListener(
            "click",
            closeMobileSidebar
        );
    }

    /* =====================================================
       15. NOTIFICATIONS
    ===================================================== */

    if ($("notificationButton")) {

        $("notificationButton").addEventListener("click", function () {

            showToast(
                "Scholarship notifications will be connected in a future step."
            );
        });
    }

    /* =====================================================
       16. LOGOUT
    ===================================================== */

    function clearAuthentication() {

        /*
         * Preserve compatibility with the login and registration
         * pages. Do not change existing storage keys unnecessarily.
         */

        [
            "token",
            "authToken",
            "jwtToken",
            "user",
            "scholarSetuCurrentUser",
            "scholarSetuRemember",
            "scholarBridgeCurrentUser",
            "scholarBridgeRemember"
        ].forEach(function (key) {

            localStorage.removeItem(key);
        });
    }

    if ($("logoutButton")) {

        $("logoutButton").addEventListener("click", function () {

            const confirmed = window.confirm(
                "Are you sure you want to log out?"
            );

            if (!confirmed) {
                return;
            }

            clearAuthentication();

            window.location.replace("login.html");
        });
    }

    /* =====================================================
       17. INITIALIZE DASHBOARD
    ===================================================== */

    async function initializeDashboard() {

        scholarshipData = [];

        renderScholarships();

        const profileLoaded = await loadStudentProfile();

        if (!profileLoaded) {
            return;
        }

        renderScholarships();

        if ($("applicationCount")) {
            $("applicationCount").textContent = "0";
        }

        if ($("documentCount")) {
            $("documentCount").textContent = "0";
        }

        console.log(
            "ScholarBridge dashboard initialized successfully."
        );
    }

    initializeDashboard();

});

document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menuToggle");
    const mainNavigation = document.getElementById("mainNavigation");
    const navigationOverlay = document.getElementById("navigationOverlay");

    if (menuToggle && mainNavigation) {
        menuToggle.addEventListener("click", function () {
            const isOpen = mainNavigation.classList.toggle("open");

            menuToggle.setAttribute("aria-expanded", String(isOpen));

            const icon = menuToggle.querySelector("i");

            if (icon) {
                icon.className = isOpen
                    ? "fa-solid fa-xmark"
                    : "fa-solid fa-bars";
            }

            if (navigationOverlay) {
                navigationOverlay.style.display = isOpen ? "block" : "none";
            }
        });

        mainNavigation.querySelectorAll("a").forEach(function (link) {
            link.addEventListener("click", function () {
                mainNavigation.classList.remove("open");
                menuToggle.setAttribute("aria-expanded", "false");

                const icon = menuToggle.querySelector("i");

                if (icon) {
                    icon.className = "fa-solid fa-bars";
                }

                if (navigationOverlay) {
                    navigationOverlay.style.display = "none";
                }
            });
        });
    }

    // Automatically highlight the current page.
    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    document.querySelectorAll(".main-navigation .nav-link").forEach(function (link) {
        const linkPage = link.getAttribute("href")
            .split("/")
            .pop()
            .toLowerCase();

        if (linkPage === currentPage) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        } else {
            link.classList.remove("active");
            link.removeAttribute("aria-current");
        }
    });
});
