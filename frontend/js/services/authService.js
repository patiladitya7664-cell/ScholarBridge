
"use strict";

/* =====================================================
   ScholarBridge AI - AUTHENTICATION SERVICE
   File: js/services/authService.js
===================================================== */

const AUTH_STORAGE_KEYS = {
    token: "token",
    currentUser: "ScholarBridgeeCurrentUser",
    user: "user",
    remember: "ScholarBridgeeRemember"
};

/**
 * Student login
 */
async function loginUser(email, password) {
    if (!email || !email.trim()) {
        throw new Error("Please enter your email address.");
    }

    if (!password) {
        throw new Error("Please enter your password.");
    }

    const data = await apiPost("/auth/login", {
        email: email.trim().toLowerCase(),
        password: password
    });

    // Support common response formats:
    // { token, user }
    // { data: { token, user } }
    const responseData = data.data || data;
    const token = responseData.token || responseData.accessToken;
    const user = responseData.user || responseData.student;

    if (!token) {
        throw new Error(
            "Login response did not contain an authentication token."
        );
    }

    saveAuthData({
        token: token,
        user: user
    });

    return {
        ...responseData,
        token: token,
        user: user
    };
}

/**
 * Save authentication token and user details.
 */
function saveAuthData(data) {
    if (!data || !data.token) {
        throw new Error("Cannot save login details without a token.");
    }

    localStorage.setItem(AUTH_STORAGE_KEYS.token, data.token);

    // Compatibility with other frontend modules.
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("jwtToken", data.token);
    localStorage.setItem("scholarBridgeToken", data.token);

    if (data.user) {
        const userJSON = JSON.stringify(data.user);

        localStorage.setItem(
            AUTH_STORAGE_KEYS.currentUser,
            userJSON
        );

        localStorage.setItem(
            AUTH_STORAGE_KEYS.user,
            userJSON
        );
    }
}

/**
 * Get authentication token.
 */
function getAuthToken() {
    return (
        localStorage.getItem(AUTH_STORAGE_KEYS.token) ||
        localStorage.getItem("scholarBridgeToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwtToken") ||
        ""
    );
}

/**
 * Get current logged-in user.
 */
function getCurrentUser() {
    const savedUser =
        localStorage.getItem(AUTH_STORAGE_KEYS.currentUser) ||
        localStorage.getItem(AUTH_STORAGE_KEYS.user);

    if (!savedUser) {
        return null;
    }

    try {
        return JSON.parse(savedUser);
    } catch (error) {
        console.error("Could not read saved user data:", error);
        return null;
    }
}

/**
 * Check whether a token exists.
 */
function isLoggedIn() {
    return Boolean(getAuthToken());
}

/**
 * Clear authentication information.
 */
function clearAuthData() {
    [
        "token",
        "authToken",
        "jwtToken",
        "scholarBridgeToken",
        "ScholarBridgeeCurrentUser",
        "ScholarBridgeCurrentUser",
        "user",
        "ScholarBridgeeRemember",
        "scholarBridgeRemember"
    ].forEach(function (key) {
        localStorage.removeItem(key);
    });
}

/**
 * Log out.
 */
function logoutUser() {
    clearAuthData();

    const currentPath = window.location.pathname.toLowerCase();

    if (!currentPath.endsWith("/login.html") &&
        !currentPath.endsWith("login.html")) {
        window.location.href = "login.html";
    }
}

/**
 * Redirect to login when authentication is required.
 */
function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = "login.html";
        return false;
    }

    return true;
}
