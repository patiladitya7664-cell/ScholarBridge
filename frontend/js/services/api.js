"use strict";

/* =====================================================
   ScholarBridge AI - API SERVICE
   File: js/services/api.js
   Connects frontend with Node.js + Express backend
===================================================== */

const API_BASE_URL = "http://localhost:5000/api";

/**
 * Get authentication token from localStorage.
 */
function getApiToken() {
    return (
        localStorage.getItem("scholarBridgeToken") ||
        localStorage.getItem("token") ||
        ""
    );
}

/**
 * Send an HTTP request to the backend.
 *
 * @param {string} endpoint
 * @param {object} options
 * @returns {Promise<object>}
 */
async function apiRequest(endpoint, options = {}) {
    const token = getApiToken();
    const headers = new Headers(options.headers || {});

    // Add JSON content type unless sending FormData.
    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    // Add authentication token when available.
    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    let response;

    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
    } catch (error) {
        throw new Error(
            "Cannot connect to the backend. Please make sure your server is running at http://localhost:5000."
        );
    }

    // Handle responses that contain no JSON.
    if (response.status === 204) {
        return {
            success: true,
            message: "Request completed successfully."
        };
    }

    const contentType = response.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
        try {
            data = await response.json();
        } catch (error) {
            throw new Error("The server returned an invalid JSON response.");
        }
    } else {
        const text = await response.text();

        data = {
            success: response.ok,
            message: text || "The server returned an unexpected response."
        };
    }

    if (!response.ok || data.success === false) {
        throw new Error(
            data.message || `Request failed with status ${response.status}.`
        );
    }

    return data;
}

/**
 * GET request
 */
async function apiGet(endpoint, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        method: "GET"
    });
}

/**
 * POST request
 */
async function apiPost(endpoint, body = {}, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        method: "POST",
        body: body instanceof FormData ? body : JSON.stringify(body)
    });
}

/**
 * PUT request
 */
async function apiPut(endpoint, body = {}, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        method: "PUT",
        body: body instanceof FormData ? body : JSON.stringify(body)
    });
}

/**
 * PATCH request
 */
async function apiPatch(endpoint, body = {}, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        method: "PATCH",
        body: body instanceof FormData ? body : JSON.stringify(body)
    });
}

/**
 * DELETE request
 */
async function apiDelete(endpoint, options = {}) {
    return apiRequest(endpoint, {
        ...options,
        method: "DELETE"
    });
}
