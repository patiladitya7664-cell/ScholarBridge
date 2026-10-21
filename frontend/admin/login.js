"use strict";

const API_BASE_URL = "http://localhost:5000/api";

const form = document.getElementById("adminLoginForm");
const message = document.getElementById("loginMessage");
const button = document.getElementById("loginButton");

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    message.textContent = "";
    button.disabled = true;
    button.textContent = "Signing in...";

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: document.getElementById("email").value.trim().toLowerCase(),
                password: document.getElementById("password").value
            })
        });

        const data = await response.json();

        if (!response.ok || data.success === false) {
            throw new Error(data.message || "Login failed.");
        }

        const result = data.data || data;
        const user = result.user;
        const token = result.token || result.accessToken;

        if (!user || !token) {
            throw new Error("The login response is missing the user or token.");
        }

        if (user.role !== "admin") {
            throw new Error("Access denied. This account is not an administrator.");
        }

        localStorage.setItem("token", token);
        localStorage.setItem("scholarBridgeToken", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("ScholarBridgeeCurrentUser", JSON.stringify(user));

        window.location.href = "dashboard.html";

    } catch (error) {
        message.textContent = error.message || "Could not connect to the backend.";
        message.className = "error";
    } finally {
        button.disabled = false;
        button.textContent = "Sign in securely";
    }
});
