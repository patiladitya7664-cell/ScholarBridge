"use strict";

/* =========================================================
   ScholarBridge AI — SHARED NAVIGATION COMPONENT

   Features:
   1. Common header navigation
   2. Mobile navigation menu
   3. Document Locker navigation
   4. Active page highlighting
   5. Profile picture synchronization
   6. Legacy sidebar compatibility
   7. Escape key and overlay close
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       1. ELEMENTS
    ===================================================== */

    const headerNav = document.getElementById("headerNav");
    const menuToggle = document.getElementById("menuToggle");

    const navigationOverlay = document.getElementById(
        "navigationOverlay"
    );

    // Header profile avatar
    const headerAvatar = document.getElementById("headerAvatar");

    // Legacy sidebar support
    const sidebar = document.querySelector(".sidebar");

    const sidebarToggle = document.querySelector(
        "#sidebarToggle, .sidebar-toggle, [data-sidebar-toggle]"
    );

    const sidebarOverlay = document.querySelector(
        "#sidebarOverlay, .sidebar-overlay"
    );

    const mobileBreakpoint = 760;

    /* =====================================================
       2. ACTIVE NAVIGATION LINK
    ===================================================== */

    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    const navigationLinks = document.querySelectorAll(
        "#headerNav a[href], " +
        ".sidebar a[href], " +
        ".sidebar-nav a[href]"
    );

    navigationLinks.forEach(function (link) {

        const href = link.getAttribute("href");

        if (
            !href ||
            href.startsWith("#") ||
            href.startsWith("javascript:") ||
            href.startsWith("mailto:") ||
            href.startsWith("tel:")
        ) {
            return;
        }

        let linkPage = "";

        try {
            const parsedURL = new URL(
                href,
                window.location.href
            );

            linkPage = parsedURL.pathname
                .split("/")
                .pop()
                .toLowerCase();

        } catch (error) {
            return;
        }

        const isCurrentPage =
            linkPage !== "" &&
            linkPage === currentPage;

        link.classList.toggle("active", isCurrentPage);

        if (isCurrentPage) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });

    /* =====================================================
       3. PROFILE PICTURE SYNCHRONIZATION

       Reads the profile photo saved by profile.js.

       Current profile.js storage key:
       scholarBridgeProfilePhotoDemo

       Supports:
       - Data URLs stored in localStorage
       - Image URLs stored in localStorage
       - Existing fallback user icon
    ===================================================== */

    const PROFILE_PHOTO_KEY = "scholarBridgeProfilePhotoDemo";

    function getSavedProfilePhoto() {

        try {
            const savedPhoto = localStorage.getItem(
                PROFILE_PHOTO_KEY
            );

            if (!savedPhoto) {
                return "";
            }

            const photo = savedPhoto.trim();

            // Accept image data URLs.
            if (
                /^data:image\/(jpeg|jpg|png|webp|gif);base64,/i.test(photo)
            ) {
                return photo;
            }

            // Accept safe HTTP(S) image URLs.
            if (/^https?:\/\//i.test(photo)) {
                const parsedURL = new URL(photo);

                if (
                    parsedURL.protocol === "https:" ||
                    parsedURL.protocol === "http:"
                ) {
                    return parsedURL.href;
                }
            }

            return "";

        } catch (error) {
            console.error(
                "Unable to read saved profile picture:",
                error
            );

            return "";
        }
    }

    function renderHeaderProfilePhoto() {

        if (!headerAvatar) {
            return;
        }

        const savedPhoto = getSavedProfilePhoto();

        if (!savedPhoto) {

            // Preserve the default user icon if no photo exists.
            if (!headerAvatar.querySelector("i")) {
                headerAvatar.replaceChildren();

                const icon = document.createElement("i");

                icon.className = "fa-solid fa-user";
                icon.setAttribute("aria-hidden", "true");

                headerAvatar.appendChild(icon);
            }

            return;
        }

        // Avoid rebuilding the image if it is already displayed.
        const existingImage = headerAvatar.querySelector("img");

        if (
            existingImage &&
            existingImage.getAttribute("src") === savedPhoto
        ) {
            return;
        }

        const image = document.createElement("img");

        image.src = savedPhoto;
        image.alt = "Profile picture";
        image.loading = "eager";
        image.decoding = "async";

        image.addEventListener("error", function () {

            // Restore fallback icon if the image cannot load.
            headerAvatar.replaceChildren();

            const icon = document.createElement("i");

            icon.className = "fa-solid fa-user";
            icon.setAttribute("aria-hidden", "true");

            headerAvatar.appendChild(icon);

        }, { once: true });

        headerAvatar.replaceChildren(image);
    }

    // Display the saved photo immediately on page load.
    renderHeaderProfilePhoto();

    // Refresh the header avatar if the photo changes in another tab.
    window.addEventListener("storage", function (event) {

        if (
            event.key === PROFILE_PHOTO_KEY ||
            event.key === null
        ) {
            renderHeaderProfilePhoto();
        }
    });

    // Allow other scripts on this page to refresh the avatar.
    window.addEventListener(
        "scholarbridge:profile-photo-updated",
        renderHeaderProfilePhoto
    );

    /* =====================================================
       4. HEADER MOBILE MENU
    ===================================================== */

    function openHeaderMenu() {

        if (!headerNav || !menuToggle) {
            return;
        }

        headerNav.classList.add("active");
        menuToggle.classList.add("active");

        menuToggle.setAttribute("aria-expanded", "true");

        menuToggle.setAttribute(
            "aria-label",
            "Close navigation menu"
        );

        if (navigationOverlay) {
            navigationOverlay.classList.add("active");
            navigationOverlay.hidden = false;
            navigationOverlay.setAttribute("aria-hidden", "false");
        }

        document.body.classList.add("navigation-open");
    }

    function closeHeaderMenu() {

        if (headerNav) {
            headerNav.classList.remove("active");
        }

        if (menuToggle) {
            menuToggle.classList.remove("active");

            menuToggle.setAttribute("aria-expanded", "false");

            menuToggle.setAttribute(
                "aria-label",
                "Open navigation menu"
            );
        }

        if (navigationOverlay) {
            navigationOverlay.classList.remove("active");
            navigationOverlay.hidden = true;
            navigationOverlay.setAttribute("aria-hidden", "true");
        }

        document.body.classList.remove("navigation-open");
    }

    function toggleHeaderMenu() {

        if (!headerNav) {
            return;
        }

        if (headerNav.classList.contains("active")) {
            closeHeaderMenu();
        } else {
            openHeaderMenu();
        }
    }

    if (menuToggle && headerNav) {

        menuToggle.setAttribute("aria-expanded", "false");

        menuToggle.setAttribute(
            "aria-label",
            "Open navigation menu"
        );

        menuToggle.addEventListener(
            "click",
            toggleHeaderMenu
        );
    }

    if (navigationOverlay) {

        navigationOverlay.hidden = true;
        navigationOverlay.setAttribute("aria-hidden", "true");

        navigationOverlay.addEventListener(
            "click",
            closeHeaderMenu
        );
    }

    /* =====================================================
       5. CLOSE HEADER MENU AFTER NAVIGATION
    ===================================================== */

    if (headerNav) {

        headerNav.querySelectorAll("a[href]").forEach(
            function (link) {

                link.addEventListener("click", function () {

                    if (window.innerWidth <= mobileBreakpoint) {
                        closeHeaderMenu();
                    }
                });
            }
        );
    }

    /* =====================================================
       6. LEGACY SIDEBAR SUPPORT
    ===================================================== */

    function openSidebar() {

        if (!sidebar) {
            return;
        }

        sidebar.classList.add("open");
        sidebar.classList.add("active");

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("active");
            sidebarOverlay.hidden = false;
        }

        if (sidebarToggle) {

            sidebarToggle.setAttribute(
                "aria-expanded",
                "true"
            );

            sidebarToggle.setAttribute(
                "aria-label",
                "Close sidebar"
            );
        }

        document.body.classList.add("sidebar-open");
    }

    function closeSidebar() {

        if (sidebar) {
            sidebar.classList.remove("open");
            sidebar.classList.remove("active");
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("active");
            sidebarOverlay.hidden = true;
        }

        if (sidebarToggle) {

            sidebarToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            sidebarToggle.setAttribute(
                "aria-label",
                "Open sidebar"
            );
        }

        document.body.classList.remove("sidebar-open");
    }

    if (sidebarToggle) {

        sidebarToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        sidebarToggle.addEventListener("click", function () {

            const isOpen =
                sidebar &&
                (
                    sidebar.classList.contains("open") ||
                    sidebar.classList.contains("active")
                );

            if (isOpen) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }

    if (sidebarOverlay) {

        sidebarOverlay.hidden = true;

        sidebarOverlay.addEventListener(
            "click",
            closeSidebar
        );
    }

    /* =====================================================
       7. ESCAPE KEY
    ===================================================== */

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            closeHeaderMenu();
            closeSidebar();
        }
    });

    /* =====================================================
       8. CLOSE MENUS WHEN RESIZING TO DESKTOP
    ===================================================== */

    window.addEventListener("resize", function () {

        if (window.innerWidth > mobileBreakpoint) {
            closeHeaderMenu();
            closeSidebar();
        }
    });

    /* =====================================================
       9. INITIALIZE
    ===================================================== */

    if (menuToggle) {
        menuToggle.setAttribute("aria-expanded", "false");
    }

    if (navigationOverlay) {
        navigationOverlay.hidden = true;
    }

    if (sidebarOverlay) {
        sidebarOverlay.hidden = true;
    }

    console.log(
        "ScholarBridge AI navigation and profile avatar initialized."
    );

});